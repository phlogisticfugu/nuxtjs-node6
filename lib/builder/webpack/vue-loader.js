'use strict';

var postcssConfig = require('./postcss');
var styleLoader = require('./style-loader');

module.exports = function vueLoader(_ref) {
  var isServer = _ref.isServer;

  // https://vue-loader.vuejs.org/en
  var config = {
    postcss: postcssConfig.call(this),
    extractCSS: !!this.options.build.extractCSS,
    cssSourceMap: this.options.build.cssSourceMap,
    preserveWhitespace: false,
    loaders: {
      js: {
        loader: 'babel-loader',
        options: this.getBabelOptions({ isServer: isServer })
      },
      // Note: do not nest the `postcss` option under `loaders`
      css: styleLoader.call(this, 'css', [], true),
      less: styleLoader.call(this, 'less', 'less-loader', true),
      scss: styleLoader.call(this, 'scss', 'sass-loader', true),
      sass: styleLoader.call(this, 'sass', { loader: 'sass-loader', options: { indentedSyntax: true } }, true),
      stylus: styleLoader.call(this, 'stylus', 'stylus-loader', true),
      styl: styleLoader.call(this, 'stylus', 'stylus-loader', true)
    },
    template: {
      doctype: 'html' // For pug, see https://github.com/vuejs/vue-loader/issues/55
    },
    transformToRequire: {
      video: 'src',
      source: 'src',
      object: 'src',
      embed: 'src'
    }

    // Return the config
  };return config;
};