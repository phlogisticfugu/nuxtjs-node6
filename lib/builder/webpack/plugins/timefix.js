'use strict';

var _classCallCheck2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Taken from https://github.com/egoist/poi/blob/3e93c88c520db2d20c25647415e6ae0d3de61145/packages/poi/lib/webpack/timefix-plugin.js#L1-L16
// Thanks to @egoist
module.exports = function () {
  function TimeFixPlugin() {
    var timefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 11000;
    (0, _classCallCheck3.default)(this, TimeFixPlugin);

    this.timefix = timefix;
  }

  (0, _createClass3.default)(TimeFixPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      compiler.plugin('watch-run', function (watching, callback) {
        watching.startTime += _this.timefix;
        callback();
      });

      compiler.plugin('done', function (stats) {
        stats.startTime -= _this.timefix;
      });
    }
  }]);
  return TimeFixPlugin;
}();