'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _typeof2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');

var _require = require('lodash'),
    uniq = _require.uniq;

var hash = require('hash-sum');

var _require2 = require('../common/utils'),
    chainFn = _require2.chainFn,
    sequence = _require2.sequence,
    printWarn = _require2.printWarn;

module.exports = function () {
  function ModuleContainer(nuxt) {
    (0, _classCallCheck3.default)(this, ModuleContainer);

    this.nuxt = nuxt;
    this.options = nuxt.options;
    this.requiredModules = {};
  }

  (0, _createClass3.default)(ModuleContainer, [{
    key: 'ready',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.nuxt.callHook('modules:before', this, this.options.modules);

              case 2:
                _context.next = 4;
                return sequence(this.options.modules, this.addModule.bind(this));

              case 4:
                _context.next = 6;
                return this.nuxt.callHook('modules:done', this);

              case 6:
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
    key: 'addVendor',
    value: function addVendor(vendor) {
      /* istanbul ignore if */
      if (typeof vendor !== 'string' && !Array.isArray(vendor)) {
        throw new Error('Invalid vendor: ' + vendor);
      }

      this.options.build.vendor = uniq(this.options.build.vendor.concat(vendor));
    }
  }, {
    key: 'addTemplate',
    value: function addTemplate(template) {
      /* istanbul ignore if */
      if (!template) {
        throw new Error('Invalid template:' + template);
      }

      // Validate & parse source
      var src = template.src || template;
      var srcPath = path.parse(src);
      /* istanbul ignore if */
      if (!src || typeof src !== 'string' || !fs.existsSync(src)) {
        throw new Error('Template not found:' + template);
      }

      // Generate unique and human readable dst filename
      var dst = template.fileName || path.basename(srcPath.dir) + ('.' + srcPath.name + '.' + hash(src)) + srcPath.ext;

      // Add to templates list
      var templateObj = {
        src: src,
        dst: dst,
        options: template.options
      };

      this.options.build.templates.push(templateObj);
      return templateObj;
    }
  }, {
    key: 'addPlugin',
    value: function addPlugin(template) {
      var _addTemplate = this.addTemplate(template),
          dst = _addTemplate.dst;

      // Add to nuxt plugins


      this.options.plugins.unshift({
        src: path.join(this.options.buildDir, dst),
        ssr: template.ssr
      });
    }
  }, {
    key: 'addLayout',
    value: function addLayout(template, name) {
      var _addTemplate2 = this.addTemplate(template),
          dst = _addTemplate2.dst,
          src = _addTemplate2.src;

      // Add to nuxt layouts


      this.options.layouts[name || path.parse(src).name] = './' + dst;
    }
  }, {
    key: 'addServerMiddleware',
    value: function addServerMiddleware(middleware) {
      this.options.serverMiddleware.push(middleware);
    }
  }, {
    key: 'extendBuild',
    value: function extendBuild(fn) {
      this.options.build.extend = chainFn(this.options.build.extend, fn);
    }
  }, {
    key: 'extendRoutes',
    value: function extendRoutes(fn) {
      this.options.router.extendRoutes = chainFn(this.options.router.extendRoutes, fn);
    }
  }, {
    key: 'requireModule',
    value: function requireModule(moduleOpts) {
      return this.addModule(moduleOpts, true /* require once */);
    }
  }, {
    key: 'addModule',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(moduleOpts, requireOnce) {
        var _this = this;

        var src, options, handler, key;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                src = void 0;
                options = void 0;
                handler = void 0;

                // Type 1: String

                if (typeof moduleOpts === 'string') {
                  src = moduleOpts;
                } else if (Array.isArray(moduleOpts)) {
                  // Type 2: Babel style array
                  src = moduleOpts[0];
                  options = moduleOpts[1];
                } else if ((typeof moduleOpts === 'undefined' ? 'undefined' : (0, _typeof3.default)(moduleOpts)) === 'object') {
                  // Type 3: Pure object
                  src = moduleOpts.src;
                  options = moduleOpts.options;
                  handler = moduleOpts.handler;
                }

                // Resolve handler
                if (!handler) {
                  handler = require(this.nuxt.resolvePath(src));
                }

                // Validate handler
                /* istanbul ignore if */

                if (!(typeof handler !== 'function')) {
                  _context2.next = 7;
                  break;
                }

                throw new Error('Module should export a function: ' + src);

              case 7:

                // Resolve module meta
                key = handler.meta && handler.meta.name || handler.name || src;

                // Update requiredModules

                if (!(typeof key === 'string')) {
                  _context2.next = 12;
                  break;
                }

                if (!(requireOnce && this.requiredModules[key])) {
                  _context2.next = 11;
                  break;
                }

                return _context2.abrupt('return');

              case 11:
                this.requiredModules[key] = { src: src, options: options, handler: handler };

              case 12:

                // Default module options to empty object
                if (options === undefined) {
                  options = {};
                }

                return _context2.abrupt('return', new _promise2.default(function (resolve, reject) {
                  // Prepare callback
                  var cb = function cb(err) {
                    printWarn('Supporting callbacks is depricated and will be removed in next releases. Consider using async/await.', src);

                    /* istanbul ignore if */
                    if (err) {
                      return reject(err);
                    }
                    resolve();
                  };

                  // Call module with `this` context and pass options
                  var result = handler.call(_this, options, cb);

                  // If module send back a promise
                  if (result && result.then) {
                    return resolve(result);
                  }

                  // If not expecting a callback but returns no promise (=synchronous)
                  if (handler.length < 2) {
                    return resolve();
                  }
                }));

              case 14:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function addModule(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return addModule;
    }()
  }]);
  return ModuleContainer;
}();