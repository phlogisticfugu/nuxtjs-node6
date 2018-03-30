'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { each } = require('lodash');
const webpack = require('webpack');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const HTMLPlugin = require('html-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');
const { existsSync } = require('fs');
const Debug = require('debug');
const Chalk = require('chalk');
const { printWarn } = require('../../common/utils');
const base = require('./base.config.js');

const debug = Debug('nuxt:build');
debug.color = 2; // Force green color

/*
|--------------------------------------------------------------------------
| Webpack Client Config
|
| Generate public/dist/client-vendor-bundle.js
| Generate public/dist/client-bundle.js
|
| In production, will generate public/dist/style.css
|--------------------------------------------------------------------------
*/
module.exports = function webpackClientConfig() {
  let config = base.call(this, { name: 'client', isServer: false });

  // Entry points
  config.entry.app = resolve(this.options.buildDir, 'client.js');
  config.entry.vendor = this.vendor();

  // Config devtool
  config.devtool = this.options.dev ? 'cheap-source-map' : false;
  config.output.devtoolModuleFilenameTemplate = '[absolute-resource-path]';

  // Add CommonChunks plugin
  commonChunksPlugin.call(this, config);

  // Env object defined in nuxt.config.js
  let env = {};
  each(this.options.env, (value, key) => {
    env['process.env.' + key] = ['boolean', 'number'].indexOf(typeof value) !== -1 ? value : (0, _stringify2.default)(value);
  });

  // Generate output HTML for SPA
  config.plugins.push(new HTMLPlugin({
    filename: 'index.spa.html',
    template: this.options.appTemplatePath,
    inject: true,
    chunksSortMode: 'dependency'
  }));

  // Generate output HTML for SSR
  if (this.options.build.ssr) {
    config.plugins.push(new HTMLPlugin({
      filename: 'index.ssr.html',
      template: this.options.appTemplatePath,
      inject: false // Resources will be injected using bundleRenderer
    }));
  }

  // Generate vue-ssr-client-manifest
  config.plugins.push(new VueSSRClientPlugin({
    filename: 'vue-ssr-client-manifest.json'
  }));

  // Extract webpack runtime & manifest
  config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'manifest',
    minChunks: Infinity,
    filename: this.getFileName('manifest')
  }));

  // Define Env
  config.plugins.push(new webpack.DefinePlugin((0, _assign2.default)(env, {
    'process.env.NODE_ENV': (0, _stringify2.default)(this.options.env.NODE_ENV || (this.options.dev ? 'development' : 'production')),
    'process.env.VUE_ENV': (0, _stringify2.default)('client'),
    'process.mode': (0, _stringify2.default)(this.options.mode),
    'process.browser': true,
    'process.client': true,
    'process.server': false,
    'process.static': this.isStatic
  })));

  // Build progress bar
  if (this.options.build.profile) {
    config.plugins.push(new ProgressPlugin({
      profile: true
    }));
  } else {
    config.plugins.push(new ProgressBarPlugin({
      complete: Chalk.green('█'),
      incomplete: Chalk.white('█'),
      format: '  :bar ' + Chalk.green.bold(':percent') + ' :msg',
      clear: false
    }));
  }

  const shouldClearConsole = this.options.build.stats !== false && this.options.build.stats !== 'errors-only';

  // Add friendly error plugin
  config.plugins.push(new FriendlyErrorsWebpackPlugin({ clearConsole: shouldClearConsole }));

  // --------------------------------------
  // Dev specific config
  // --------------------------------------
  if (this.options.dev) {
    // https://webpack.js.org/plugins/named-modules-plugin
    config.plugins.push(new webpack.NamedModulesPlugin());

    // Add HMR support
    config.entry.app = [
    // https://github.com/glenjamin/webpack-hot-middleware#config
    `webpack-hot-middleware/client?name=client&reload=true&timeout=30000&path=${this.options.router.base}/__webpack_hmr`.replace(/\/\//g, '/'), config.entry.app];
    config.plugins.push(new webpack.HotModuleReplacementPlugin(), new webpack.NoEmitOnErrorsPlugin());

    // DllReferencePlugin
    if (this.options.build.dll) {
      dllPlugin.call(this, config);
    }
  }

  // --------------------------------------
  // Production specific config
  // --------------------------------------
  if (!this.options.dev) {
    // Scope Hoisting
    if (this.options.build.scopeHoisting === true) {
      config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
    }

    // Chunks size limit
    // https://webpack.js.org/plugins/aggressive-splitting-plugin/
    if (this.options.build.maxChunkSize) {
      config.plugins.push(new webpack.optimize.AggressiveSplittingPlugin({
        minSize: this.options.build.maxChunkSize,
        maxSize: this.options.build.maxChunkSize
      }));
    }

    // https://webpack.js.org/plugins/hashed-module-ids-plugin
    config.plugins.push(new webpack.HashedModuleIdsPlugin());

    // Minify JS
    // https://github.com/webpack-contrib/uglifyjs-webpack-plugin
    if (this.options.build.uglify !== false) {
      config.plugins.push(new UglifyJSPlugin((0, _assign2.default)({
        // cache: true,
        sourceMap: true,
        parallel: true,
        extractComments: {
          filename: 'LICENSES'
        },
        uglifyOptions: {
          output: {
            comments: /^\**!|@preserve|@license|@cc_on/
          }
        }
      }, this.options.build.uglify)));
    }

    // Webpack Bundle Analyzer
    if (this.options.build.analyze) {
      config.plugins.push(new BundleAnalyzerPlugin((0, _assign2.default)({}, this.options.build.analyze)));
    }
  }

  // Extend config
  if (typeof this.options.build.extend === 'function') {
    const isDev = this.options.dev;
    const extendedConfig = this.options.build.extend.call(this, config, {
      get dev() {
        printWarn('dev has been deprecated in build.extend(), please use isDev');
        return isDev;
      },
      isDev,
      isClient: true
    });
    // Only overwrite config when something is returned for backwards compatibility
    if (extendedConfig !== undefined) {
      config = extendedConfig;
    }
  }

  return config;
};

// --------------------------------------------------------------------------
// Adds Common Chunks Plugin
// --------------------------------------------------------------------------
function commonChunksPlugin(config) {
  // Create explicit vendor chunk
  config.plugins.unshift(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: this.getFileName('vendor'),
    minChunks(module, count) {
      // A module is extracted into the vendor chunk when...
      return (
        // If it's inside node_modules
        /node_modules/.test(module.context) &&
        // Do not externalize if the request is a CSS file or a Vue file which can potentially emit CSS assets!
        !/\.(css|less|scss|sass|styl|stylus|vue)$/.test(module.request)
      );
    }
  }));
}

// --------------------------------------------------------------------------
// Adds DLL plugin
// https://github.com/webpack/webpack/tree/master/examples/dll-user
// --------------------------------------------------------------------------
function dllPlugin(config) {
  const _dlls = [];
  const vendorEntries = this.vendorEntries();
  const dllDir = resolve(this.options.cacheDir, config.name + '-dll');
  (0, _keys2.default)(vendorEntries).forEach(v => {
    const dllManifestFile = resolve(dllDir, v + '-manifest.json');
    if (existsSync(dllManifestFile)) {
      _dlls.push(v);
      config.plugins.push(new webpack.DllReferencePlugin({
        // context: this.options.rootDir,
        manifest: dllManifestFile // Using full path to allow finding .js dll file
      }));
    }
  });
  if (_dlls.length) {
    debug('Using dll for ' + _dlls.join(','));
  }
}