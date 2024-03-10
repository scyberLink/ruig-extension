import { spawnSync } from "child_process";
import { program } from "commander";
import fs from 'fs';
//import leven from 'leven';
import path from "path";
import { minify } from 'terser';
import IManifest from "./IManifest";
import { ZipFile } from "yazl";
import IFile from "./IFile";

const pkg = require('../package.json');

module.exports = function (argv: string[]): void {
	program.version(pkg.version).usage('<command>');

	program
		.command('package')
		.description(`Package project the current project`)
		//.option('-c, --package', 'Package the project', false)
		.option('-a, --assetsDir', 'Assets dir can be in public dir or any where', `./public/assets`)
		.action(({ assetsDir }) => _package(assetsDir));
	/* 
		program
			.command('show <extensionid>')
			.description(`Shows an extension's metadata`)
			.option('--json', 'Outputs data in json format', false)
			.action((extensionid, { json }) => main(show(extensionid, json)));
	 */
	program.on('command:*', ([cmd]: string) => {

		program.outputHelp(help => {
			//const availableCommands = program.commands.map(c => c.name);
			//const suggestion = availableCommands.find(c => leven(c as any, cmd) < c.length * 0.4);

			help = `${help}\n Unknown command '${cmd}'`;

			return /* suggestion ? `${help}, did you mean '${suggestion}'?\n` :  */`${help}.\n`;
		});
		process.exit(1);
	});

	program.description(`${pkg.description}
	To learn more about the Ruig extension API: https://aka.ms/ruig-extension-api
	To connect with the Ruig extension developer community: https://aka.ms/ruig-discussions`);

	program.parse(argv);
};

async function _package(assetsDir: string) {
	const tsConfigFile = './tsconfig.json'
	const tsConfigFileContent = fs.readFileSync(tsConfigFile, 'utf8');
	const tsconfig = JSON.parse(tsConfigFileContent)
	const tsBuildDir = tsconfig?.compilerOptions?.outDir

	if (!tsBuildDir) {
		throw new Error("Please specify outDir in tsconfig compilerOptions")
	}

	if (!(
		pkg.name &&
		pkg.version &&
		pkg.description &&
		pkg.publisher
	)) {
		throw new Error(`You must specify name, version, description, and publisher in package.json file`)
	}

	const manifest: IManifest = {
		name: pkg.name,
		version: pkg.version,
		description: pkg.description,
		publisher: pkg.publisher,
	}

	const outDir = `/tmp/${pkg.name}_${pkg.version}_production`
	const bundleName = 'extension.ruigem'
	const manifesName = 'manifest.json'
	const minBundleName = 'extension.min.ruigem'
	const importationsName = 'importations.json'
	const bundlePath = path.join(outDir, bundleName);
	const manifestPath = path.join(outDir, manifesName);
	const minBundlePath = path.join(outDir, minBundleName);
	const importationsPath = path.join(outDir, importationsName);

	spawnSync('npx', ['tsc'])

	let importations: string[] = []
	let files: string[] = []

	const ignorePatterns = readIgnorePatterns();

	const compiled = __package(tsBuildDir, files, importations, ignorePatterns).join('\n\n').trim()

	spawnSync('rm', ['-rf', outDir])
	spawnSync('mkdir', ['-p', outDir])
	fs.writeFileSync(bundlePath, compiled);
	fs.writeFileSync(importationsPath, JSON.stringify(importations));
	fs.writeFileSync(manifestPath, JSON.stringify(manifest));

	const result = await minify(compiled, { mangle: true })
	fs.writeFileSync(minBundlePath, result.code as string);

	zip(manifest, outDir, assetsDir)
	spawnSync('rm', ['-rf', outDir])
}

function __package(directory: string, files: string[], importations: string[], ignorePatterns: RegExp[]): string[] {
	const children = fs.readdirSync(directory);

	children.forEach(item => {
		const filePath = path.join(directory, item);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			__package(filePath, files, importations, ignorePatterns);
		} else {
			if (!ignorePatterns.some(pattern => pattern.test(filePath)) && filePath.endsWith('.js')) {
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const { stripped, imports } = stripImportsAndExports(fileContent);
				files.push(stripped);
				importations.push(...imports);
			}
		}
	});

	return files;
}

function stripImportsAndExports(content: string): { stripped: string; imports: string[] } {
	const importRegex = /import\s*({[^}]+}|\w+)\s*from\s*['"].+?['"];?/g;
	const exportRegex = /export\s+.+?;/g;
	const imports: string[] = [];
	const stripped = content.replace(importRegex, (_match, importStatement) => {
		if (importStatement.startsWith('{')) {

			const namedImports: string[] = importStatement.substring(1, importStatement.length - 1).split(',');

			namedImports.forEach(namedImport => {
				imports.push(namedImport.trim());
			});

			return '';
		} else {
			imports.push(importStatement.trim());
			return '';
		}
	}).replace(exportRegex, '').trim();
	return { stripped, imports };
}

function readIgnorePatterns(): RegExp[] {
	const ignoreFilePath = '.ruigemIgnore';
	if (fs.existsSync(ignoreFilePath)) {
		const ignoreFileContent = fs.readFileSync(ignoreFilePath, 'utf8');
		return ignoreFileContent
			.split('\n')
			.filter(line => !!line.trim())
			.map(pattern => new RegExp(pattern.trim()));
	}
	return [];
}

async function zip(manifest: IManifest, outDir: string, assetsDir: string) {
	const packagePath = `./${manifest.publisher}.${manifest.name}.v${manifest.version}.rex`
	const files: IFile[] = collectFiles(outDir, assetsDir)
	await writeRex(files, packagePath)
	const stats = await fs.promises.stat(packagePath);

	let size = 0;
	let unit = '';

	if (stats.size > 1048576) {
		size = Math.round(stats.size / 10485.76) / 100;
		unit = 'MB';
	} else {
		size = Math.round(stats.size / 10.24) / 100;
		unit = 'KB';
	}

	console.log(`Packaged: ${packagePath} (${size}${unit})`);
}

async function writeRex(files: IFile[], packagePath: string) {
	return await fs.promises
		.unlink(packagePath)
		.catch(async (err) => (err.code !== 'ENOENT' ? await Promise.reject(err) : await Promise.resolve(null)))
		.then(
			async () =>
				await new Promise((c, e) => {
					const zip = new ZipFile();
					files.forEach(f => zip.addFile(f.localPath, f.path, { mode: 0o600 })
					);
					zip.end();

					const zipStream = fs.createWriteStream(packagePath);
					zip.outputStream.pipe(zipStream);

					zip.outputStream.once('error', e);
					zipStream.once('error', e);
					zipStream.once('finish', c);
				})
		);
}

function collectFiles(outDir: string, assetsDir: string): IFile[] {
	const files = _collectFiles([], assetsDir)

	const children = fs.readdirSync(outDir);

	files.push(...children)


	return []
}

function _collectFiles(files: string[], directory: string) {
	if (fs.existsSync(directory)) {
		const children = fs.readdirSync(directory);
		const acceptedFiles = ['.jpg', '.jpeg', '.png', '.pdf']

		children.forEach(item => {
			const filePath = path.join(directory, item);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				_collectFiles(files, directory);
			} else {
				if (acceptedFiles.some(pattern => filePath.includes(pattern))) {
					files.push(filePath);
				} else {
					console.warn(`${filePath} not included. Asset not supported. Supported assets includes: jpg, png, pdf`)
				}
			}
		});
	}

	return files;
}

