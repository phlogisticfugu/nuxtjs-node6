'use strict';

var _typeof2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var _require = require('lodash'),
    cloneDeep = _require.cloneDeep;

var _require2 = require('path'),
    join = _require2.join,
    resolve = _require2.resolve;

var _require3 = require('../../common/utils'),
    isUrl = _require3.isUrl,
    urlJoin = _require3.urlJoin;

var vueLoader = require('./vue-loader');
var styleLoader = require('./style-loader');
var TimeFixPlugin = require('./plugins/timefix');
var WarnFixPlugin = require('./plugins/warnfix');

/*
|--------------------------------------------------------------------------
| Webpack Shared Config
|
| This is the config which is extended by the server and client
| webpack config files
|--------------------------------------------------------------------------
*/
module.exports = function webpackBaseConfig(_ref) {
  var name = _ref.name,
      isServer = _ref.isServer;

  // Prioritize nested node_modules in webpack search path (#2558)
  var webpackModulesDir = ['node_modules'].concat(this.options.modulesDir);

  var configAlias = {};

  // Used by vue-loader so we can use in templates
  // with <img src="~/assets/nuxt.png"/>
  configAlias[this.options.dir.assets] = join(this.options.srcDir, this.options.dir.assets);
  configAlias[this.options.dir.static] = join(this.options.srcDir, this.options.dir.static);

  var config = {
    name: name,
    entry: {
      app: null
    },
    output: {
      path: resolve(this.options.buildDir, 'dist'),
      filename: this.getFileName('app'),
      chunkFilename: this.getFileName('chunk'),
      publicPath: isUrl(this.options.build.publicPath) ? this.options.build.publicPath : urlJoin(this.options.router.base, this.options.build.publicPath)
    },
    performance: {
      maxEntrypointSize: 1000000,
      maxAssetSize: 300000,
      hints: this.options.dev ? false : 'warning'
    },
    resolve: {
      extensions: ['.js', '.json', '.vue', '.jsx'],
      alias: (0, _assign2.default)({
        '~': join(this.options.srcDir),
        '~~': join(this.options.rootDir),
        '@': join(this.options.srcDir),
        '@@': join(this.options.rootDir)
      }, configAlias),
      modules: webpackModulesDir
    },
    resolveLoader: {
      modules: webpackModulesDir
    },
    module: {
      noParse: /es6-promise\.js$/, // Avoid webpack shimming process
      rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoader.call(this, { isServer: isServer })
      }, {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: this.getBabelOptions({ isServer: isServer })
      }, { test: /\.css$/, use: styleLoader.call(this, 'css') }, { test: /\.less$/, use: styleLoader.call(this, 'less', 'less-loader') }, {
        test: /\.sass$/,
        use: styleLoader.call(this, 'sass', {
          loader: 'sass-loader',
          options: { indentedSyntax: true }
        })
      }, { test: /\.scss$/, use: styleLoader.call(this, 'scss', 'sass-loader') }, {
        test: /\.styl(us)?$/,
        use: styleLoader.call(this, 'stylus', 'stylus-loader')
      }, {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 1000, // 1KO
          name: 'img/[name].[hash:7].[ext]'
        }
      }, {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1000, // 1 KO
          name: 'fonts/[name].[hash:7].[ext]'
        }
      }, {
        test: /\.(webm|mp4)$/,
        loader: 'file-loader',
        options: {
          name: 'videos/[name].[hash:7].[ext]'
        }
      }]
    },
    plugins: this.options.build.plugins

    // Add timefix-plugin before others plugins
  };if (this.options.dev) {
    config.plugins.unshift(new TimeFixPlugin());
  }

  // Hide warnings about plugins without a default export (#1179)
  config.plugins.push(new WarnFixPlugin());

  // CSS extraction
  var extractCSS = this.options.build.extractCSS;
  if (extractCSS) {
    var extractOptions = (0, _assign2.default)({ filename: this.getFileName('css') }, (typeof extractCSS === 'undefined' ? 'undefined' : (0, _typeof3.default)(extractCSS)) === 'object' ? extractCSS : {});
    config.plugins.push(new ExtractTextPlugin(extractOptions));
  }

  // Clone deep avoid leaking config between Client and Server
  return cloneDeep(config);
};