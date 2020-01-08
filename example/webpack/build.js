const { resolve } = require('path');
const devConfig = require('./dev');

const config = {
    ...devConfig,
    output: {
        path: resolve(__dirname, '../public'),
        filename: 'app.min.js',
    },
    devtool: false,
    mode: 'production',
};

config.output.filename = 'app.min.js';

module.exports = config;
