'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('fs'),
    existsSync = _require.existsSync;

var _require2 = require('path'),
    resolve = _require2.resolve,
    join = _require2.join;

var _require3 = require('lodash'),
    cloneDeep = _require3.cloneDeep;

var _require4 = require('../../common/utils'),
    isPureObject = _require4.isPureObject;

var createResolver = require('postcss-import-resolver');

module.exports = function postcssConfig() {
  var _this = this;

  var config = cloneDeep(this.options.build.postcss);

  /* istanbul ignore if */
  if (!config) {
    return false;
  }

  // Search for postCSS config file and use it if exists
  // https://github.com/michael-ciniawsky/postcss-load-config
  var _arr = [this.options.srcDir, this.options.rootDir];
  for (var _i = 0; _i < _arr.length; _i++) {
    var dir = _arr[_i];var _arr2 = ['postcss.config.js', '.postcssrc.js', '.postcssrc', '.postcssrc.json', '.postcssrc.yaml'];

    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var file = _arr2[_i2];
      if (existsSync(resolve(dir, file))) {
        var postcssConfigPath = resolve(dir, file);
        return {
          sourceMap: this.options.build.cssSourceMap,
          config: {
            path: postcssConfigPath
          }
        };
      }
    }
  }

  // Normalize
  if (Array.isArray(config)) {
    config = { plugins: config };
  }

  // Apply default plugins
  if (isPureObject(config)) {
    config = (0, _assign2.default)({
      useConfigFile: false,
      sourceMap: this.options.build.cssSourceMap,
      plugins: {
        // https://github.com/postcss/postcss-import
        'postcss-import': {
          resolve: createResolver({
            alias: {
              '~': join(this.options.srcDir),
              '~~': join(this.options.rootDir),
              '@': join(this.options.srcDir),
              '@@': join(this.options.rootDir)
            },
            modules: [this.options.srcDir, this.options.rootDir].concat((0, _toConsumableArray3.default)(this.options.modulesDir))
          })
        },

        // https://github.com/postcss/postcss-url
        'postcss-url': {},

        // http://cssnext.io/postcss
        'postcss-cssnext': {}
      }
    }, config);
  }

  // Map postcss plugins into instances on object mode once
  if (isPureObject(config) && isPureObject(config.plugins)) {
    config.plugins = (0, _keys2.default)(config.plugins).map(function (p) {
      var plugin = require(_this.nuxt.resolvePath(p));
      var opts = config.plugins[p];
      if (opts === false) return; // Disabled
      var instance = plugin(opts);
      return instance;
    }).filter(function (e) {
      return e;
    });
  }

  return config;
};