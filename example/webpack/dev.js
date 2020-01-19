const { resolve } = require('path');

module.exports = {
    devtool: 'inline-source-map',
    mode: 'development',
    entry: [resolve(__dirname, '../src/index.js')],
    output: {
        path: resolve(__dirname, '../dist'),
        filename: 'app.min.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                            '@babel/plugin-proposal-class-properties',
                        ],
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
};
