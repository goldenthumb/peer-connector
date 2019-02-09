const { resolve } = require('path');

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  output: {
    path: resolve(__dirname, '../dist'),
    filename: 'app.min.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            "presets": [
              ["env", {
                "targets": {
                  "node": "current"
                }
              }],
            ],
            "plugins": [
              ["transform-object-rest-spread", { "useBuiltIns": true }]
            ]
          }
        },
        exclude: /node_modules/
      },
    ]
  }
};