var openInBrowser = process.argv[3] === '--silence' ? false: true
var HtmlWebpackPlugin = require('html-webpack-plugin')
var { CleanWebpackPlugin } = require('clean-webpack-plugin')
var CopywebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  context: __dirname,
  entry: [
    './src/script/lib/pixi.js',
    './src/script/lib/gsap/TweenMax.js',
    './src/script/Popstar.es6',
  ],
  output: {
    path: __dirname + '/dist/',
    filename: '[name]-[chunkhash].js'
  },
  module: {
    rules: [
      {
        test: function (src) {
          if (
            src.indexOf('script/lib/pixi.js') > 0 ||
            src.indexOf('script/lib/gsap/TweenMax.js') > 0
          ) {
            return false
          }
          if (/\.es6$|\.js$/.test(src)) {
            return true
          }
        },
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.png$|\.jpg$|\.jpeg$|\.gif$/i,
        use: {
          loader: 'file-loader',
          query: {
            limit: 20000,
            name: '[name]-[hash:5].[ext]',
            outputPath: './images/',
            publicPath: '../images/'
          }
        },
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'H5小游戏100例: 消除星星',
      template: './src/popstar.html',
      filename: './dist/popstar.html'
    }),
    new CopywebpackPlugin([
      {
        from: './src/css/popstar.css',
        to: './dist/css/popstar.css'
      }
    ])
  ],
  watch: true,
  devServer: {
    contentBase: './dist/',
    open: openInBrowser,
    openPage: './dist/popstar.html'
  }
}

