'use strict';

var webpack = require('webpack');

var _require = require('path'),
    resolve = _require.resolve;

var ClientConfig = require('./client.config');

/*
|--------------------------------------------------------------------------
| Webpack Dll Config
| https://github.com/webpack/webpack/tree/master/examples/dll
|--------------------------------------------------------------------------
*/
module.exports = function webpackDllConfig(_refConfig) {
  var refConfig = _refConfig || new ClientConfig();

  var name = refConfig.name + '-dll';
  var dllDir = resolve(this.options.cacheDir, name);

  var config = {
    name: name,
    entry: this.vendorEntries(),
    // context: this.options.rootDir,
    resolve: refConfig.resolve,
    target: refConfig.target,
    resolveLoader: refConfig.resolveLoader,
    module: refConfig.module,
    plugins: []
  };

  config.output = {
    path: dllDir,
    filename: '[name]_[hash].js',
    library: '[name]_[hash]'
  };

  config.plugins.push(new webpack.DllPlugin({
    // The path to the manifest file which maps between
    // modules included in a bundle and the internal IDs
    // within that bundle
    path: resolve(dllDir, '[name]-manifest.json'),

    name: '[name]_[hash]'
  }));

  return config;
};