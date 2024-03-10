"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
//import leven from 'leven';
const path_1 = __importDefault(require("path"));
const terser_1 = require("terser");
const yazl_1 = require("yazl");
const pkg = require('../package.json');
module.exports = function (argv) {
    commander_1.program.version(pkg.version).usage('<command>');
    commander_1.program
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
    commander_1.program.on('command:*', ([cmd]) => {
        commander_1.program.outputHelp(help => {
            //const availableCommands = program.commands.map(c => c.name);
            //const suggestion = availableCommands.find(c => leven(c as any, cmd) < c.length * 0.4);
            help = `${help}\n Unknown command '${cmd}'`;
            return /* suggestion ? `${help}, did you mean '${suggestion}'?\n` :  */ `${help}.\n`;
        });
        process.exit(1);
    });
    commander_1.program.description(`${pkg.description}
	To learn more about the Ruig extension API: https://aka.ms/ruig-extension-api
	To connect with the Ruig extension developer community: https://aka.ms/ruig-discussions`);
    commander_1.program.parse(argv);
};
async function _package(assetsDir) {
    const tsConfigFile = './tsconfig.json';
    const tsConfigFileContent = fs_1.default.readFileSync(tsConfigFile, 'utf8');
    const tsconfig = JSON.parse(tsConfigFileContent);
    const tsBuildDir = tsconfig?.compilerOptions?.outDir;
    if (!tsBuildDir) {
        throw new Error("Please specify outDir in tsconfig compilerOptions");
    }
    if (!(pkg.name &&
        pkg.version &&
        pkg.description &&
        pkg.publisher)) {
        throw new Error(`You must specify name, version, description, and publisher in package.json file`);
    }
    const manifest = {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        publisher: pkg.publisher,
    };
    const outDir = `/tmp/${pkg.name}_${pkg.version}_production`;
    const bundleName = 'extension.ruigem';
    const manifesName = 'manifest.json';
    const minBundleName = 'extension.min.ruigem';
    const importationsName = 'importations.json';
    const bundlePath = path_1.default.join(outDir, bundleName);
    const manifestPath = path_1.default.join(outDir, manifesName);
    const minBundlePath = path_1.default.join(outDir, minBundleName);
    const importationsPath = path_1.default.join(outDir, importationsName);
    (0, child_process_1.spawnSync)('npx', ['tsc']);
    let importations = [];
    let files = [];
    const ignorePatterns = readIgnorePatterns();
    const compiled = __package(tsBuildDir, files, importations, ignorePatterns).join('\n\n').trim();
    (0, child_process_1.spawnSync)('rm', ['-rf', outDir]);
    (0, child_process_1.spawnSync)('mkdir', ['-p', outDir]);
    fs_1.default.writeFileSync(bundlePath, compiled);
    fs_1.default.writeFileSync(importationsPath, JSON.stringify(importations));
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest));
    const result = await (0, terser_1.minify)(compiled, { mangle: true });
    fs_1.default.writeFileSync(minBundlePath, result.code);
    zip(manifest, outDir, assetsDir);
    (0, child_process_1.spawnSync)('rm', ['-rf', outDir]);
}
function __package(directory, files, importations, ignorePatterns) {
    const children = fs_1.default.readdirSync(directory);
    children.forEach(item => {
        const filePath = path_1.default.join(directory, item);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            __package(filePath, files, importations, ignorePatterns);
        }
        else {
            if (!ignorePatterns.some(pattern => pattern.test(filePath)) && filePath.endsWith('.js')) {
                const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                const { stripped, imports } = stripImportsAndExports(fileContent);
                files.push(stripped);
                importations.push(...imports);
            }
        }
    });
    return files;
}
function stripImportsAndExports(content) {
    const importRegex = /import\s*({[^}]+}|\w+)\s*from\s*['"].+?['"];?/g;
    const exportRegex = /export\s+.+?;/g;
    const imports = [];
    const stripped = content.replace(importRegex, (_match, importStatement) => {
        if (importStatement.startsWith('{')) {
            const namedImports = importStatement.substring(1, importStatement.length - 1).split(',');
            namedImports.forEach(namedImport => {
                imports.push(namedImport.trim());
            });
            return '';
        }
        else {
            imports.push(importStatement.trim());
            return '';
        }
    }).replace(exportRegex, '').trim();
    return { stripped, imports };
}
function readIgnorePatterns() {
    const ignoreFilePath = '.ruigemIgnore';
    if (fs_1.default.existsSync(ignoreFilePath)) {
        const ignoreFileContent = fs_1.default.readFileSync(ignoreFilePath, 'utf8');
        return ignoreFileContent
            .split('\n')
            .filter(line => !!line.trim())
            .map(pattern => new RegExp(pattern.trim()));
    }
    return [];
}
async function zip(manifest, outDir, assetsDir) {
    const packagePath = `./${manifest.publisher}.${manifest.name}.v${manifest.version}.rex`;
    const files = collectFiles(outDir, assetsDir);
    await writeRex(files, packagePath);
    const stats = await fs_1.default.promises.stat(packagePath);
    let size = 0;
    let unit = '';
    if (stats.size > 1048576) {
        size = Math.round(stats.size / 10485.76) / 100;
        unit = 'MB';
    }
    else {
        size = Math.round(stats.size / 10.24) / 100;
        unit = 'KB';
    }
    console.log(`Packaged: ${packagePath} (${size}${unit})`);
}
async function writeRex(files, packagePath) {
    return await fs_1.default.promises
        .unlink(packagePath)
        .catch(async (err) => (err.code !== 'ENOENT' ? await Promise.reject(err) : await Promise.resolve(null)))
        .then(async () => await new Promise((c, e) => {
        const zip = new yazl_1.ZipFile();
        files.forEach(f => zip.addFile(f.localPath, f.path, { mode: 0o600 }));
        zip.end();
        const zipStream = fs_1.default.createWriteStream(packagePath);
        zip.outputStream.pipe(zipStream);
        zip.outputStream.once('error', e);
        zipStream.once('error', e);
        zipStream.once('finish', c);
    }));
}
function collectFiles(outDir, assetsDir) {
    const files = _collectFiles([], assetsDir);
    const children = fs_1.default.readdirSync(outDir);
    files.push(...children);
    return [];
}
function _collectFiles(files, directory) {
    if (fs_1.default.existsSync(directory)) {
        const children = fs_1.default.readdirSync(directory);
        const acceptedFiles = ['.jpg', '.jpeg', '.png', '.pdf'];
        children.forEach(item => {
            const filePath = path_1.default.join(directory, item);
            const stat = fs_1.default.statSync(filePath);
            if (stat.isDirectory()) {
                _collectFiles(files, directory);
            }
            else {
                if (acceptedFiles.some(pattern => filePath.includes(pattern))) {
                    files.push(filePath);
                }
                else {
                    console.warn(`${filePath} not included. Asset not supported. Supported assets includes: jpg, png, pdf`);
                }
            }
        });
    }
    return files;
}
//# sourceMappingURL=ruigem.js.map