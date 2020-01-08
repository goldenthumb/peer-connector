const { resolve } = require('path');
const devConfig = require('./dev');
const buildConfig = require('./build');

module.exports = (env) => {
    const config = {
        ...devConfig,
        entry: [resolve(__dirname, `../src/${(env && env.custom) ? 'custom' : 'index'}.js`)],
        devServer: {
            port: 3000,
            host: 'localhost',
            contentBase: resolve(__dirname, '../views'),
            publicPath: '/dist/js',
        }
    };
    
    config.output.filename = buildConfig.output.filename;
    
    return config;
};
