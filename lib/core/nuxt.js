'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Debug = require('debug');
var enableDestroy = require('server-destroy');
var Module = require('module');

var _require = require('lodash'),
    isPlainObject = _require.isPlainObject;

var chalk = require('chalk');

var _require2 = require('fs-extra'),
    existsSync = _require2.existsSync;

var _require3 = require('../common'),
    Options = _require3.Options;

var _require4 = require('../common/utils'),
    sequence = _require4.sequence,
    printError = _require4.printError,
    printWarn = _require4.printWarn;

var _require5 = require('path'),
    resolve = _require5.resolve,
    join = _require5.join;

var _require6 = require('../../package.json'),
    version = _require6.version;

var ModuleContainer = require('./module');
var Renderer = require('./renderer');

var debug = Debug('nuxt:');
debug.color = 5;

module.exports = function () {
  function Nuxt() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Nuxt);

    this.options = Options.from(options);

    this.initialized = false;
    this.onError = this.onError.bind(this);

    // Hooks
    this._hooks = {};
    this.hook = this.hook.bind(this);

    // Create instance of core components
    this.moduleContainer = new ModuleContainer(this);
    this.renderer = new Renderer(this);

    // Backward compatibility
    this.errorHandler = this.onError;
    this.render = this.renderer.app;
    this.renderRoute = this.renderer.renderRoute.bind(this.renderer);
    this.renderAndGetWindow = this.renderer.renderAndGetWindow.bind(this.renderer);

    this._ready = this.ready().catch(function (err) {
      return _this.onError(err);
    });
  }

  (0, _createClass3.default)(Nuxt, [{
    key: 'ready',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._ready) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this._ready);

              case 2:

                // Add hooks
                if (isPlainObject(this.options.hooks)) {
                  this.addObjectHooks(this.options.hooks);
                } else if (typeof this.options.hooks === 'function') {
                  this.options.hooks(this.hook);
                }

                // Await for modules
                _context.next = 5;
                return this.moduleContainer.ready();

              case 5:
                _context.next = 7;
                return this.renderer.ready();

              case 7:

                this.initialized = true;

                // Call ready hook
                _context.next = 10;
                return this.callHook('ready', this);

              case 10:
                return _context.abrupt('return', this);

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ready() {
        return _ref.apply(this, arguments);
      }

      return ready;
    }()
  }, {
    key: 'plugin',
    value: function plugin(name, fn) {
      // A tiny backward compatibility util
      var hook = {
        ready: 'ready',
        close: 'close',
        listen: 'listen',
        built: 'build:done'
      }[name];

      if (hook) {
        this.hook(hook, fn);
        printWarn('nuxt.plugin(\'' + name + '\',..) is deprecated. Use new hooks system.');
      } else {
        throw new Error('nuxt.plugin(\'' + name + '\',..) is not supported. Use new hooks system.');
      }

      // Always return nuxt class which has plugin() for two level hooks
      return this;
    }
  }, {
    key: 'hook',
    value: function hook(name, fn) {
      if (!name || typeof fn !== 'function') {
        return;
      }
      this._hooks[name] = this._hooks[name] || [];
      this._hooks[name].push(fn);
    }
  }, {
    key: 'onError',
    value: function onError(err) {
      var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Nuxt error';

      // Log error to the console if there is not any error listener
      if (!this._hooks['error']) {
        printError(err, from);
        return;
      }

      // Call error hooks
      this.callHook('error', err, from);
    }
  }, {
    key: 'callHook',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(name) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this._hooks[name]) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                debug('Call ' + name + ' hooks (' + this._hooks[name].length + ')');
                _context2.prev = 3;
                _context2.next = 6;
                return sequence(this._hooks[name], function (fn) {
                  return fn.apply(undefined, (0, _toConsumableArray3.default)(args));
                });

              case 6:
                _context2.next = 11;
                break;

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2['catch'](3);

                this.onError(_context2.t0, name);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 8]]);
      }));

      function callHook(_x3) {
        return _ref2.apply(this, arguments);
      }

      return callHook;
    }()
  }, {
    key: 'addObjectHooks',
    value: function addObjectHooks(hooksObj) {
      var _this2 = this;

      (0, _keys2.default)(hooksObj).forEach(function (name) {
        var hooks = hooksObj[name];
        hooks = Array.isArray(hooks) ? hooks : [hooks];

        hooks.forEach(function (hook) {
          _this2.hook(name, hook);
        });
      });
    }
  }, {
    key: 'listen',
    value: function listen() {
      var _this3 = this;

      var port = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;
      var host = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'localhost';

      return new _promise2.default(function (resolve, reject) {
        var server = _this3.renderer.app.listen({ port: port, host: host, exclusive: false }, function (err) {
          /* istanbul ignore if */
          if (err) {
            return reject(err);
          }

          var _host = host === '0.0.0.0' ? 'localhost' : host;
          // eslint-disable-next-line no-console
          console.log('\n' + chalk.bgGreen.black(' OPEN ') + chalk.green(' http://' + _host + ':' + port + '\n'));

          // Close server on nuxt close
          _this3.hook('close', function () {
            return new _promise2.default(function (resolve, reject) {
              // Destroy server by forcing every connection to be closed
              server.destroy(function (err) {
                debug('server closed');
                /* istanbul ignore if */
                if (err) {
                  return reject(err);
                }
                resolve();
              });
            });
          });

          _this3.callHook('listen', server, { port: port, host: host }).then(resolve);
        });

        // Add server.destroy(cb) method
        enableDestroy(server);
      });
    }
  }, {
    key: 'resolveAlias',
    value: function resolveAlias(path) {
      if (path.indexOf('@@') === 0 || path.indexOf('~~') === 0) {
        return join(this.options.rootDir, path.substr(2));
      }

      if (path.indexOf('@') === 0 || path.indexOf('~') === 0) {
        return join(this.options.srcDir, path.substr(1));
      }

      return resolve(this.options.srcDir, path);
    }
  }, {
    key: 'resolvePath',
    value: function resolvePath(path) {
      // Try to resolve using NPM resolve path first
      try {
        var resolvedPath = Module._resolveFilename(path, {
          paths: this.options.modulesDir
        });
        return resolvedPath;
      } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') {
          throw error;
        }
      }

      var _path = this.resolveAlias(path);

      if (existsSync(_path)) {
        return _path;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this.options.extensions), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var ext = _step.value;

          if (existsSync(_path + '.' + ext)) {
            return _path + '.' + ext;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      throw new Error('Cannot resolve "' + path + '" from "' + _path + '"');
    }
  }, {
    key: 'close',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(callback) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.callHook('close', this);

              case 2:
                if (!(typeof callback === 'function')) {
                  _context3.next = 5;
                  break;
                }

                _context3.next = 5;
                return callback();

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function close(_x6) {
        return _ref3.apply(this, arguments);
      }

      return close;
    }()
  }], [{
    key: 'version',
    get: function get() {
      return version;
    }
  }]);
  return Nuxt;
}();