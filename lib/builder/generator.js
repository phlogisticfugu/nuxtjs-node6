'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

var _require = require('fs-extra'),
    copy = _require.copy,
    remove = _require.remove,
    writeFile = _require.writeFile,
    mkdirp = _require.mkdirp,
    removeSync = _require.removeSync,
    existsSync = _require.existsSync;

var _ = require('lodash');

var _require2 = require('path'),
    resolve = _require2.resolve,
    join = _require2.join,
    dirname = _require2.dirname,
    sep = _require2.sep;

var _require3 = require('html-minifier'),
    minify = _require3.minify;

var Chalk = require('chalk');

var _require4 = require('../common/utils'),
    printWarn = _require4.printWarn;

var _require5 = require('../common/utils'),
    isUrl = _require5.isUrl,
    promisifyRoute = _require5.promisifyRoute,
    waitFor = _require5.waitFor,
    flatRoutes = _require5.flatRoutes,
    pe = _require5.pe;

module.exports = function () {
  function Generator(nuxt, builder) {
    (0, _classCallCheck3.default)(this, Generator);

    this.nuxt = nuxt;
    this.options = nuxt.options;
    this.builder = builder;

    // Set variables
    this.staticRoutes = resolve(this.options.srcDir, this.options.dir.static);
    this.srcBuiltPath = resolve(this.options.buildDir, 'dist');
    this.distPath = resolve(this.options.rootDir, this.options.generate.dir);
    this.distNuxtPath = join(this.distPath, isUrl(this.options.build.publicPath) ? '' : this.options.build.publicPath);
  }

  (0, _createClass3.default)(Generator, [{
    key: 'generate',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref2$build = _ref2.build,
            build = _ref2$build === undefined ? true : _ref2$build,
            _ref2$init = _ref2.init,
            init = _ref2$init === undefined ? true : _ref2$init;

        var routes, errors;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.initiate({ build: build, init: init });

              case 2:
                _context.next = 4;
                return this.initRoutes();

              case 4:
                routes = _context.sent;
                _context.next = 7;
                return this.generateRoutes(routes);

              case 7:
                errors = _context.sent;
                _context.next = 10;
                return this.afterGenerate();

              case 10:
                _context.next = 12;
                return this.nuxt.callHook('generate:done', this, errors);

              case 12:
                return _context.abrupt('return', { errors: errors });

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function generate() {
        return _ref.apply(this, arguments);
      }

      return generate;
    }()
  }, {
    key: 'initiate',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref4$build = _ref4.build,
            build = _ref4$build === undefined ? true : _ref4$build,
            _ref4$init = _ref4.init,
            init = _ref4$init === undefined ? true : _ref4$init;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.nuxt.ready();

              case 2:
                _context2.next = 4;
                return this.nuxt.callHook('generate:before', this, this.options.generate);

              case 4:
                if (!build) {
                  _context2.next = 8;
                  break;
                }

                // Add flag to set process.static
                this.builder.forGenerate();

                // Start build process
                _context2.next = 8;
                return this.builder.build();

              case 8:
                if (!init) {
                  _context2.next = 11;
                  break;
                }

                _context2.next = 11;
                return this.initDist();

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function initiate() {
        return _ref3.apply(this, arguments);
      }

      return initiate;
    }()
  }, {
    key: 'initRoutes',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        var generateRoutes,
            _len,
            args,
            _key,
            routes,
            _args3 = arguments;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // Resolve config.generate.routes promises before generating the routes
                generateRoutes = [];

                if (!(this.options.router.mode !== 'hash')) {
                  _context3.next = 13;
                  break;
                }

                _context3.prev = 2;

                for (_len = _args3.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = _args3[_key];
                }

                _context3.next = 6;
                return promisifyRoute.apply(undefined, [this.options.generate.routes || []].concat((0, _toConsumableArray3.default)(args)));

              case 6:
                generateRoutes = _context3.sent;
                _context3.next = 13;
                break;

              case 9:
                _context3.prev = 9;
                _context3.t0 = _context3['catch'](2);

                console.error('Could not resolve routes'); // eslint-disable-line no-console
                throw _context3.t0;

              case 13:
                // Generate only index.html for router.mode = 'hash'
                routes = this.options.router.mode === 'hash' ? ['/'] : flatRoutes(this.options.router.routes);

                routes = this.decorateWithPayloads(routes, generateRoutes);

                // extendRoutes hook
                _context3.next = 17;
                return this.nuxt.callHook('generate:extendRoutes', routes);

              case 17:
                return _context3.abrupt('return', routes);

              case 18:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[2, 9]]);
      }));

      function initRoutes() {
        return _ref5.apply(this, arguments);
      }

      return initRoutes;
    }()
  }, {
    key: 'generateRoutes',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(routes) {
        var _this = this;

        var errors, _loop;

        return _regenerator2.default.wrap(function _callee5$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                errors = [];

                // Start generate process

                _loop = /*#__PURE__*/_regenerator2.default.mark(function _loop() {
                  var n;
                  return _regenerator2.default.wrap(function _loop$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          n = 0;
                          _context5.next = 3;
                          return _promise2.default.all(routes.splice(0, _this.options.generate.concurrency).map(function () {
                            var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(_ref7) {
                              var route = _ref7.route,
                                  payload = _ref7.payload;
                              return _regenerator2.default.wrap(function _callee4$(_context4) {
                                while (1) {
                                  switch (_context4.prev = _context4.next) {
                                    case 0:
                                      _context4.next = 2;
                                      return waitFor(n++ * _this.options.generate.interval);

                                    case 2:
                                      _context4.next = 4;
                                      return _this.generateRoute({ route: route, payload: payload, errors: errors });

                                    case 4:
                                    case 'end':
                                      return _context4.stop();
                                  }
                                }
                              }, _callee4, _this);
                            }));

                            return function (_x4) {
                              return _ref8.apply(this, arguments);
                            };
                          }()));

                        case 3:
                        case 'end':
                          return _context5.stop();
                      }
                    }
                  }, _loop, _this);
                });

              case 2:
                if (!routes.length) {
                  _context6.next = 6;
                  break;
                }

                return _context6.delegateYield(_loop(), 't0', 4);

              case 4:
                _context6.next = 2;
                break;

              case 6:

                // Improve string representation for errors
                errors.toString = function () {
                  return _this._formatErrors(errors);
                };

                return _context6.abrupt('return', errors);

              case 8:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee5, this);
      }));

      function generateRoutes(_x3) {
        return _ref6.apply(this, arguments);
      }

      return generateRoutes;
    }()
  }, {
    key: '_formatErrors',
    value: function _formatErrors(errors) {
      return errors.map(function (_ref9) {
        var type = _ref9.type,
            route = _ref9.route,
            error = _ref9.error;

        var isHandled = type === 'handled';
        var bgColor = isHandled ? 'bgYellow' : 'bgRed';
        var color = isHandled ? 'yellow' : 'red';

        var line = Chalk.black[bgColor](' ROUTE ') + Chalk[color](' ' + route + '\n\n');

        if (isHandled) {
          line += Chalk.grey((0, _stringify2.default)(error, undefined, 2) + '\n');
        } else {
          line += Chalk.grey(pe.render(error));
        }

        return line;
      }).join('\n');
    }
  }, {
    key: 'afterGenerate',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
        var fallback, fallbackPath, _ref11, html;

        return _regenerator2.default.wrap(function _callee6$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                fallback = this.options.generate.fallback;

                // Disable SPA fallback if value isn't true or a string

                if (!(fallback !== true && typeof fallback !== 'string')) {
                  _context7.next = 3;
                  break;
                }

                return _context7.abrupt('return');

              case 3:
                fallbackPath = join(this.distPath, fallback);

                // Prevent conflicts

                if (!existsSync(fallbackPath)) {
                  _context7.next = 7;
                  break;
                }

                printWarn('SPA fallback was configured, but the configured path (' + fallbackPath + ') already exists.');
                return _context7.abrupt('return');

              case 7:
                _context7.next = 9;
                return this.nuxt.renderRoute('/', { spa: true });

              case 9:
                _ref11 = _context7.sent;
                html = _ref11.html;
                _context7.next = 13;
                return writeFile(fallbackPath, html, 'utf8');

              case 13:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee6, this);
      }));

      function afterGenerate() {
        return _ref10.apply(this, arguments);
      }

      return afterGenerate;
    }()
  }, {
    key: 'initDist',
    value: function () {
      var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
        var _this2 = this;

        var nojekyllPath, extraFiles;
        return _regenerator2.default.wrap(function _callee7$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return remove(this.distPath);

              case 2:
                _context8.next = 4;
                return this.nuxt.callHook('generate:distRemoved', this);

              case 4:
                if (!existsSync(this.staticRoutes)) {
                  _context8.next = 7;
                  break;
                }

                _context8.next = 7;
                return copy(this.staticRoutes, this.distPath);

              case 7:
                _context8.next = 9;
                return copy(this.srcBuiltPath, this.distNuxtPath);

              case 9:

                // Add .nojekyll file to let Github Pages add the _nuxt/ folder
                // https://help.github.com/articles/files-that-start-with-an-underscore-are-missing/
                nojekyllPath = resolve(this.distPath, '.nojekyll');

                writeFile(nojekyllPath, '');

                // Cleanup SSR related files
                extraFiles = ['index.spa.html', 'index.ssr.html', 'server-bundle.json', 'vue-ssr-client-manifest.json'].map(function (file) {
                  return resolve(_this2.distNuxtPath, file);
                });


                extraFiles.forEach(function (file) {
                  if (existsSync(file)) {
                    removeSync(file);
                  }
                });

                _context8.next = 15;
                return this.nuxt.callHook('generate:distCopied', this);

              case 15:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee7, this);
      }));

      function initDist() {
        return _ref12.apply(this, arguments);
      }

      return initDist;
    }()
  }, {
    key: 'decorateWithPayloads',
    value: function decorateWithPayloads(routes, generateRoutes) {
      var routeMap = {};
      // Fill routeMap for known routes
      routes.forEach(function (route) {
        routeMap[route] = {
          route: route,
          payload: null
        };
      });
      // Fill routeMap with given generate.routes
      generateRoutes.forEach(function (route) {
        // route is either a string or like { route : '/my_route/1', payload: {} }
        var path = _.isString(route) ? route : route.route;
        routeMap[path] = {
          route: path,
          payload: route.payload || null
        };
      });
      return _.values(routeMap);
    }
  }, {
    key: 'generateRoute',
    value: function () {
      var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(_ref13) {
        var route = _ref13.route,
            _ref13$payload = _ref13.payload,
            payload = _ref13$payload === undefined ? {} : _ref13$payload,
            _ref13$errors = _ref13.errors,
            errors = _ref13$errors === undefined ? [] : _ref13$errors;
        var html, pageErrors, res, minifyErr, path, page;
        return _regenerator2.default.wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                html = void 0;
                pageErrors = [];
                _context9.prev = 2;
                _context9.next = 5;
                return this.nuxt.renderer.renderRoute(route, {
                  _generate: true,
                  payload: payload
                });

              case 5:
                res = _context9.sent;

                html = res.html;
                if (res.error) {
                  pageErrors.push({ type: 'handled', route: route, error: res.error });
                }
                _context9.next = 17;
                break;

              case 10:
                _context9.prev = 10;
                _context9.t0 = _context9['catch'](2);

                /* istanbul ignore next */
                pageErrors.push({ type: 'unhandled', route: route, error: _context9.t0 });
                Array.prototype.push.apply(errors, pageErrors);

                _context9.next = 16;
                return this.nuxt.callHook('generate:routeFailed', {
                  route: route,
                  errors: pageErrors
                });

              case 16:
                return _context9.abrupt('return', false);

              case 17:

                if (this.options.generate.minify) {
                  try {
                    html = minify(html, this.options.generate.minify);
                  } catch (err) /* istanbul ignore next */{
                    minifyErr = new Error('HTML minification failed. Make sure the route generates valid HTML. Failed HTML:\n ' + html);

                    pageErrors.push({ type: 'unhandled', route: route, error: minifyErr });
                  }
                }

                path = void 0;


                if (this.options.generate.subFolders) {
                  path = join(route, sep, 'index.html'); // /about -> /about/index.html
                  path = path === '/404/index.html' ? '/404.html' : path; // /404 -> /404.html
                } else {
                  path = route.length > 1 ? join(sep, route + '.html') : join(sep, 'index.html');
                }

                // Call hook to let user update the path & html
                page = { route: route, path: path, html: html };
                _context9.next = 23;
                return this.nuxt.callHook('generate:page', page);

              case 23:

                page.path = join(this.distPath, page.path);

                // Make sure the sub folders are created
                _context9.next = 26;
                return mkdirp(dirname(page.path));

              case 26:
                _context9.next = 28;
                return writeFile(page.path, page.html, 'utf8');

              case 28:
                _context9.next = 30;
                return this.nuxt.callHook('generate:routeCreated', {
                  route: route,
                  path: page.path,
                  errors: pageErrors
                });

              case 30:

                if (pageErrors.length) {
                  Array.prototype.push.apply(errors, pageErrors);
                }

                return _context9.abrupt('return', true);

              case 32:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee8, this, [[2, 10]]);
      }));

      function generateRoute(_x5) {
        return _ref14.apply(this, arguments);
      }

      return generateRoute;
    }()
  }]);
  return Generator;
}();