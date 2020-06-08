const path = require('path');
const glob = require('glob-all');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const isProductionMode = process.env.NODE_ENV === 'production';

const FRONTEND_JS_PATH = __dirname + '/frontend/app/';

module.exports = {
  node: {
    fs: 'empty'
  },
  mode: 'production',
  devtool: 'inline-source-map',
  resolve: {
    modules: ['node_modules', 'frontend/components']
  },
  entry: {
    app: glob.sync([
      FRONTEND_JS_PATH + '**/*.module.js',
      FRONTEND_JS_PATH + '**/!(*spec).js'
    ])
  },
  output: {
    filename: isProductionMode ? '[name].[hash].js' : '[name].js',
    chunkFilename: isProductionMode ? '[id].[hash]-chunk.js' : '[id]-chunk.js',
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
    new webpack.LoaderOptionsPlugin({ options: {} }),
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
    ],
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      automaticNameMaxLength: 30,
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
};
