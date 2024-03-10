const path = require('path');

module.exports = {
    entry: 'src/index.tsx', // Entry point of your application
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js'], // Resolve TypeScript and JavaScript files
    },
    mode: "development",
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
