'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var webpack = require('webpack');
var VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
var nodeExternals = require('webpack-node-externals');

var _require = require('lodash'),
    each = _require.each;

var _require2 = require('path'),
    resolve = _require2.resolve;

var _require3 = require('fs'),
    existsSync = _require3.existsSync;

var _require4 = require('../../common/utils'),
    printWarn = _require4.printWarn;

var base = require('./base.config.js');

/*
|--------------------------------------------------------------------------
| Webpack Server Config
|--------------------------------------------------------------------------
*/
module.exports = function webpackServerConfig() {
  var config = base.call(this, { name: 'server', isServer: true });

  // Env object defined in nuxt.config.js
  var env = {};
  each(this.options.env, function (value, key) {
    env['process.env.' + key] = ['boolean', 'number'].indexOf(typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) !== -1 ? value : (0, _stringify2.default)(value);
  });

  // Config devtool
  config.devtool = this.options.dev ? 'cheap-source-map' : false;

  config = (0, _assign2.default)(config, {
    target: 'node',
    node: false,
    entry: resolve(this.options.buildDir, 'server.js'),
    output: (0, _assign2.default)({}, config.output, {
      filename: 'server-bundle.js',
      libraryTarget: 'commonjs2'
    }),
    performance: {
      hints: false,
      maxAssetSize: Infinity
    },
    externals: [],
    plugins: (config.plugins || []).concat([new VueSSRServerPlugin({
      filename: 'server-bundle.json'
    }), new webpack.DefinePlugin((0, _assign2.default)(env, {
      'process.env.NODE_ENV': (0, _stringify2.default)(this.options.env.NODE_ENV || (this.options.dev ? 'development' : 'production')),
      'process.env.VUE_ENV': (0, _stringify2.default)('server'),
      'process.mode': (0, _stringify2.default)(this.options.mode),
      'process.browser': false,
      'process.client': false,
      'process.server': true,
      'process.static': this.isStatic
    }))])
  });

  // https://webpack.js.org/configuration/externals/#externals
  // https://github.com/liady/webpack-node-externals
  this.options.modulesDir.forEach(function (dir) {
    if (existsSync(dir)) {
      config.externals.push(nodeExternals({
        // load non-javascript files with extensions, presumably via loaders
        whitelist: [/es6-promise|\.(?!(?:js|json)$).{1,5}$/i],
        modulesDir: dir
      }));
    }
  });

  // Extend config
  if (typeof this.options.build.extend === 'function') {
    var isDev = this.options.dev;
    var extendedConfig = this.options.build.extend.call(this, config, {
      get dev() {
        printWarn('dev has been deprecated in build.extend(), please use isDev');
        return isDev;
      },
      isDev: isDev,
      isServer: true
    });
    // Only overwrite config when something is returned for backwards compatibility
    if (extendedConfig !== undefined) {
      config = extendedConfig;
    }
  }

  return config;
};