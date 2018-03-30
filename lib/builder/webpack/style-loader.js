'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var _require = require('path'),
    join = _require.join;

var postcssConfig = require('./postcss');

module.exports = function styleLoader(ext) {
  var loaders = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var isVueLoader = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var sourceMap = Boolean(this.options.build.cssSourceMap);

  // Normalize loaders
  loaders = (Array.isArray(loaders) ? loaders : [loaders]).map(function (loader) {
    return (0, _assign2.default)({ options: { sourceMap: sourceMap } }, typeof loader === 'string' ? { loader: loader } : loader);
  });

  // Prepare vue-style-loader
  // https://github.com/vuejs/vue-style-loader
  var vueStyleLoader = {
    loader: 'vue-style-loader',
    options: { sourceMap: sourceMap }

    // -- Configure additional loaders --

    // style-resources-loader
    // https://github.com/yenshih/style-resources-loader
  };if (this.options.build.styleResources[ext]) {
    var patterns = Array.isArray(this.options.build.styleResources[ext]) ? this.options.build.styleResources[ext] : [this.options.build.styleResources[ext]];
    var options = (0, _assign2.default)({}, this.options.build.styleResources.options || {}, { patterns: patterns });

    loaders.push({
      loader: 'style-resources-loader',
      options: options
    });
  }

  // postcss-loader
  // vue-loader already provides it's own
  // https://github.com/postcss/postcss-loader
  if (!isVueLoader) {
    var _postcssConfig = postcssConfig.call(this);

    if (_postcssConfig) {
      loaders.unshift({
        loader: 'postcss-loader',
        options: (0, _assign2.default)({ sourceMap: sourceMap }, _postcssConfig)
      });
    }
  }

  // css-loader
  // https://github.com/webpack-contrib/css-loader
  var cssLoaderAlias = {};
  cssLoaderAlias['/' + this.options.dir.assets] = join(this.options.srcDir, this.options.dir.assets);
  cssLoaderAlias['/' + this.options.dir.static] = join(this.options.srcDir, this.options.dir.static);

  loaders.unshift({
    loader: 'css-loader',
    options: {
      sourceMap: sourceMap,
      minimize: !this.options.dev,
      importLoaders: loaders.length, // Important!
      alias: cssLoaderAlias
    }
  });

  // -- With extractCSS --
  // TODO: Temporary disabled in dev mode for fixing source maps
  // (We need `source-map` devtool for *.css modules)
  if (this.options.build.extractCSS && !this.options.dev) {
    // ExtractTextPlugin
    // https://github.com/webpack-contrib/extract-text-webpack-plugin
    var extractLoader = ExtractTextPlugin.extract({
      use: loaders,
      fallback: vueStyleLoader
    });

    // css-hot-loader
    // https://github.com/shepherdwind/css-hot-loader
    var hotLoader = {
      loader: 'css-hot-loader',
      options: { sourceMap: sourceMap }
    };

    return this.options.dev ? [hotLoader].concat(extractLoader) : extractLoader;
  }

  // -- Without extractCSS --
  return [vueStyleLoader].concat(loaders);
};