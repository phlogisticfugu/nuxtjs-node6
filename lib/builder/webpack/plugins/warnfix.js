'use strict';

var _classCallCheck2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {
  function WarnFixPlugin() {
    (0, _classCallCheck3.default)(this, WarnFixPlugin);
  }

  (0, _createClass3.default)(WarnFixPlugin, [{
    key: 'apply',
    value: function apply(compiler) /* istanbul ignore next */{
      compiler.plugin('done', function (stats) {
        stats.compilation.warnings = stats.compilation.warnings.filter(function (warn) {
          if (warn.name === 'ModuleDependencyWarning' && warn.message.includes('export \'default\'') && warn.message.includes('nuxt_plugin_')) {
            return false;
          }
          return true;
        });
      });
    }
  }]);
  return WarnFixPlugin;
}();