const { resolve } = require('path');
const webpack = require('webpack');
const { CommonsChunkPlugin/*, UglifyJsPlugin*/ } = webpack.optimize;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// webpack config helpers
const { getIfUtils, removeEmpty } = require('webpack-config-utils');

module.exports = (env) => {
  const { ifProd, ifNotProd, ifTest, ifNotTest } = getIfUtils(env);
  return {
    context: resolve(__dirname, 'src'),
    entry: {
      polyfills: './polyfills.ts',
      main: './main.ts',
    },
    output: {
      filename: '[name].[hash].js',
      path: resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx']
    },
    devtool: 'source-map',
    performance: {
      hints: ifProd() && 'warning'
    },
    devServer: {
      stats: 'minimal',
    },
    module: {
      rules: [
        // addition - add source-map support
        {
          enforce: "pre",
          test: /\.jsx?$/,
          loader: "source-map-loader",
          exclude: /src/
        },
        // Typescript
        {
          test: /\.tsx?$/,
          include: /src/,
          use: [{
            loader: 'awesome-typescript-loader',
            options: {
              silent: ifProd(),
            }
          }]
        },
        // CSS
        {
          test: /\.css$/,
          include: /node_modules/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { sourceMap: true }
            }
          ]
        },
        // global app styles
        {
          test: /styles\.css$/,
          include: /src/,
          use: ifNotProd(
            [
              { loader: "style-loader" },
              { loader: "css-loader" },
            ],
            ExtractTextPlugin.extract({
              fallback: "style-loader",
              use: "css-loader"
            })
          )
        },
        // ShadowDom inline string styles
        {
          resource: {
            test: /\.css$/,
            include: /src/,
            not: [resolve(__dirname, 'src/styles.css')]
          },
          use: [
            { loader: 'to-string-loader' },
            { loader: 'css-loader' },
          ]
        },

      ]
    },
    plugins: removeEmpty([

      new CopyWebpackPlugin([
        // here we are just copying es5shim adapter from node_modules if you wanna use it directly in HTML - NOT RECOMMENDED
        { from: resolve(__dirname, 'node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js' ), to: 'wc'},
      ]),

      // Set NODE_ENV to enable production react version
      new webpack.DefinePlugin({
        'process.env': { NODE_ENV: ifProd('"production"', '"development"') }
      }),

      new ProgressBarPlugin(),

      ifProd(
        new ExtractTextPlugin('[name].css')
      ),

      new CommonsChunkPlugin({
        name: 'polyfills',
        chunks: ['polyfills']
      }),
      // This enables tree shaking of the vendor modules
      new CommonsChunkPlugin({
        name: 'vendor',
        chunks: ['main'],
        minChunks: (module, count) => /node_modules\//.test(module.resource)
      }),
      // Specify the correct order the scripts will be injected in
      new CommonsChunkPlugin({
        name: ['vendor', 'polyfills']
      }),

      // prints more readable module names in the browser console on HMR updates
      ifNotProd(
        new webpack.NamedModulesPlugin()
      ),

      ifProd(
        new UglifyJsPlugin({
          sourceMap: true,
          compress: {
            screw_ie8: true,
            warnings: false
          },
          output: { comments: false }
        })
      ),

      new webpack.LoaderOptionsPlugin(
        ifProd({
          minimize: true,
          debug: false
        })
      ),

      new HtmlWebpackPlugin({
        template: resolve('src', 'index.html'),
        // https://github.com/kangax/html-minifier#options-quick-reference
        // will minify html
        minify: ifProd(
          {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            keepClosingSlash: true,
            minifyURLs: true
          },
          false
        )
      }),

    ])
  }
}
