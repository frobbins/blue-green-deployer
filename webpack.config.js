const path = require('path');
const glob = require('glob');

module.exports = {
    mode: 'development', // or 'production'
    entry: glob.sync('./stacks/app/**/*.ts'),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'build'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    externals: {
        path: 'path',
        fs: 'fs',
        assert: 'assert',
        os: 'os',
        constants: 'constants'
    },
};
