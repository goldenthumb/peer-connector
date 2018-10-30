const devConfig = require('./dev');

const config = {
  ...devConfig,
  devtool: false,
  mode: 'production',
};

config.output.filename = 'app.min.js';

module.exports = config;