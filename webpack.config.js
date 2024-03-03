const path = require('path');

module.exports = {
    entry: './src/InternalExtension.ts', // Entry point of your application
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'], // Resolve TypeScript and JavaScript files
    },
    mode: "production",
    module: {
        rules: [
            {
                //test: /\.tsx?$/,
                test: /\.ts*/,
                use: 'ts-loader', // Use ts-loader for TypeScript files
                exclude: /node_modules/,
            },
            {
                test: /\.svg$/,
                use: 'file-loader'
            }
        ],
    },
};
