const path = require('path');
const glob = require('glob-all');
const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const isProductionMode = process.env.NODE_ENV === 'production';

const FRONTEND_JS_PATH = path.join(__dirname, 'frontend/js/');
const APP_ENTRY_POINT = path.join(FRONTEND_JS_PATH, 'app.js');

module.exports = {
  mode: 'production',
  entry: {
    app: glob.sync([
      APP_ENTRY_POINT,
      `${FRONTEND_JS_PATH}**/!(*spec).js`
    ])
  },
  output: {
    filename: isProductionMode ? '[name].[hash].js' : '[name].js',
    path: path.resolve(__dirname, 'dist/')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|frontend\/components)/,
        use: [
          {
            loader: 'ng-annotate-loader',
            options: {
              ngAnnotate: 'ng-annotate-patched',
              es6: true,
              dynamicImport: true,
              explicitOnly: false
            }
          },
          {
            loader: 'babel-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({options: {}}),
    new CleanWebpackPlugin(),
    new webpack.HashedModuleIdsPlugin()
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: !isProductionMode
      })
    ]
  }
};
