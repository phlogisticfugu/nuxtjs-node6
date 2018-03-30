'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _toConsumableArray2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('util'),
    promisify = _require.promisify;

var _ = require('lodash');
var chokidar = require('chokidar');

var _require2 = require('fs-extra'),
    remove = _require2.remove,
    readFile = _require2.readFile,
    writeFile = _require2.writeFile,
    mkdirp = _require2.mkdirp,
    existsSync = _require2.existsSync;

var hash = require('hash-sum');
var webpack = require('webpack');
var serialize = require('serialize-javascript');

var _require3 = require('path'),
    join = _require3.join,
    resolve = _require3.resolve,
    basename = _require3.basename,
    extname = _require3.extname,
    dirname = _require3.dirname;

var MFS = require('memory-fs');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var Debug = require('debug');
var Glob = require('glob');

var _require4 = require('../common/utils'),
    r = _require4.r,
    wp = _require4.wp,
    wChunk = _require4.wChunk,
    createRoutes = _require4.createRoutes,
    sequence = _require4.sequence,
    relativeTo = _require4.relativeTo,
    waitFor = _require4.waitFor;

var _require5 = require('../common'),
    Options = _require5.Options;

var clientWebpackConfig = require('./webpack/client.config.js');
var serverWebpackConfig = require('./webpack/server.config.js');
var dllWebpackConfig = require('./webpack/dll.config.js');
var upath = require('upath');

var debug = Debug('nuxt:build');
debug.color = 2; // Force green color

var glob = promisify(Glob);

module.exports = function () {
  function Builder(nuxt) {
    var _this = this;

    (0, _classCallCheck3.default)(this, Builder);

    this.nuxt = nuxt;
    this.isStatic = false; // Flag to know if the build is for a generated app
    this.options = nuxt.options;

    // Fields that set on build
    this.compilers = [];
    this.compilersWatching = [];
    this.webpackDevMiddleware = null;
    this.webpackHotMiddleware = null;
    this.filesWatcher = null;
    this.customFilesWatcher = null;

    // Mute stats on dev
    this.webpackStats = this.options.dev ? false : this.options.build.stats;

    // Helper to resolve build paths
    this.relativeToBuild = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return relativeTo.apply(undefined, [_this.options.buildDir].concat(args));
    };

    this._buildStatus = STATUS.INITIAL;

    // Stop watching on nuxt.close()
    if (this.options.dev) {
      this.nuxt.hook('close', function () {
        return _this.unwatch();
      });
    }
    // else {
    // TODO: enable again when unsafe concern resolved.(common/options.js:42)
    // this.nuxt.hook('build:done', () => this.generateConfig())
    // }
  }

  (0, _createClass3.default)(Builder, [{
    key: 'vendor',
    value: function vendor() {
      return ['vue', 'vue-router', 'vue-meta', this.options.store && 'vuex'].concat(this.options.build.extractCSS && [
      // https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/456
      'vue-style-loader/lib/addStylesClient', 'css-loader/lib/css-base']).concat(this.options.build.vendor).filter(function (v) {
        return v;
      });
    }
  }, {
    key: 'vendorEntries',
    value: function vendorEntries() {
      // Used for dll
      var vendor = this.vendor();
      var vendorEntries = {};
      vendor.forEach(function (v) {
        try {
          require.resolve(v);
          vendorEntries[v] = [v];
        } catch (e) {
          // Ignore
        }
      });
      return vendorEntries;
    }
  }, {
    key: 'forGenerate',
    value: function forGenerate() {
      this.isStatic = true;
    }
  }, {
    key: 'build',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var dir;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this._buildStatus === STATUS.BUILD_DONE && this.options.dev)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this);

              case 2:
                if (!(this._buildStatus === STATUS.BUILDING)) {
                  _context.next = 6;
                  break;
                }

                _context.next = 5;
                return waitFor(1000);

              case 5:
                return _context.abrupt('return', this.build());

              case 6:
                this._buildStatus = STATUS.BUILDING;

                // Wait for nuxt ready
                _context.next = 9;
                return this.nuxt.ready();

              case 9:
                _context.next = 11;
                return this.nuxt.callHook('build:before', this, this.options.build);

              case 11:

                // Check if pages dir exists and warn if not
                this._nuxtPages = typeof this.options.build.createRoutes !== 'function';

                if (!this._nuxtPages) {
                  _context.next = 20;
                  break;
                }

                if (existsSync(join(this.options.srcDir, this.options.dir.pages))) {
                  _context.next = 20;
                  break;
                }

                dir = this.options.srcDir;

                if (!existsSync(join(this.options.srcDir, '..', this.options.dir.pages))) {
                  _context.next = 19;
                  break;
                }

                throw new Error('No `' + this.options.dir.pages + '` directory found in ' + dir + '. Did you mean to run `nuxt` in the parent (`../`) directory?');

              case 19:
                throw new Error('Couldn\'t find a `' + this.options.dir.pages + '` directory in ' + dir + '. Please create one under the project root');

              case 20:

                debug('App root: ' + this.options.srcDir);
                debug('Generating ' + this.options.buildDir + ' files...');

                // Create .nuxt/, .nuxt/components and .nuxt/dist folders
                _context.next = 24;
                return remove(r(this.options.buildDir));

              case 24:
                _context.next = 26;
                return mkdirp(r(this.options.buildDir, 'components'));

              case 26:
                if (this.options.dev) {
                  _context.next = 29;
                  break;
                }

                _context.next = 29;
                return mkdirp(r(this.options.buildDir, 'dist'));

              case 29:
                _context.next = 31;
                return this.generateRoutesAndFiles();

              case 31:
                _context.next = 33;
                return this.webpackBuild();

              case 33:

                // Flag to set that building is done
                this._buildStatus = STATUS.BUILD_DONE;

                // Call done hook
                _context.next = 36;
                return this.nuxt.callHook('build:done', this);

              case 36:
                return _context.abrupt('return', this);

              case 37:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function build() {
        return _ref.apply(this, arguments);
      }

      return build;
    }()
  }, {
    key: 'getBabelOptions',
    value: function getBabelOptions(_ref2) {
      var isServer = _ref2.isServer;

      var options = _.defaults({}, {
        babelrc: false,
        cacheDirectory: !!this.options.dev
      }, this.options.build.babel);

      if (typeof options.presets === 'function') {
        options.presets = options.presets({ isServer: isServer });
      }

      if (!options.babelrc && !options.presets) {
        options.presets = [[require.resolve('babel-preset-vue-app'), {
          targets: isServer ? { node: '8.0.0' } : { ie: 9, uglify: true }
        }]];
      }

      return options;
    }
  }, {
    key: 'getFileName',
    value: function getFileName(name) {
      var fileName = this.options.build.filenames[name];

      // Don't use hashes when watching
      // https://github.com/webpack/webpack/issues/1914#issuecomment-174171709
      if (this.options.dev) {
        fileName = fileName.replace(/\[(chunkhash|contenthash|hash)\]\./g, '');
      }

      return fileName;
    }
  }, {
    key: 'generateRoutesAndFiles',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        var _this2 = this;

        var templatesFiles, templateVars, layoutsFiles, hasErrorLayout, files, extendedRoutes, customTemplateFiles, indicatorPath1, indicatorPath2, indicatorPath;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                debug('Generating files...');
                // -- Templates --
                templatesFiles = ['App.js', 'client.js', 'index.js', 'middleware.js', 'router.js', 'server.js', 'utils.js', 'empty.js', 'components/nuxt-error.vue', 'components/nuxt-loading.vue', 'components/nuxt-child.js', 'components/nuxt-link.js', 'components/nuxt.js', 'components/no-ssr.js', 'views/app.template.html', 'views/error.html'];
                templateVars = {
                  options: this.options,
                  extensions: this.options.extensions.map(function (ext) {
                    return ext.replace(/^\./, '');
                  }).join('|'),
                  messages: this.options.messages,
                  uniqBy: _.uniqBy,
                  isDev: this.options.dev,
                  debug: this.options.debug,
                  mode: this.options.mode,
                  router: this.options.router,
                  env: this.options.env,
                  head: this.options.head,
                  middleware: existsSync(join(this.options.srcDir, this.options.dir.middleware)),
                  store: this.options.store,
                  css: this.options.css,
                  plugins: this.plugins,
                  appPath: './App.js',
                  ignorePrefix: this.options.ignorePrefix,
                  layouts: (0, _assign2.default)({}, this.options.layouts),
                  loading: typeof this.options.loading === 'string' ? this.relativeToBuild(this.options.srcDir, this.options.loading) : this.options.loading,
                  transition: this.options.transition,
                  layoutTransition: this.options.layoutTransition,
                  dir: this.options.dir,
                  components: {
                    ErrorPage: this.options.ErrorPage ? this.relativeToBuild(this.options.ErrorPage) : null
                  }

                  // -- Layouts --
                };

                if (!existsSync(resolve(this.options.srcDir, this.options.dir.layouts))) {
                  _context3.next = 10;
                  break;
                }

                _context3.next = 6;
                return glob(this.options.dir.layouts + '/**/*.{vue,js}', {
                  cwd: this.options.srcDir,
                  ignore: this.options.ignore
                });

              case 6:
                layoutsFiles = _context3.sent;
                hasErrorLayout = false;

                layoutsFiles.forEach(function (file) {
                  var name = file.split('/').slice(1).join('/').replace(/\.(vue|js)$/, '');
                  if (name === 'error') {
                    hasErrorLayout = true;
                    return;
                  }
                  if (!templateVars.layouts[name] || /\.vue$/.test(file)) {
                    templateVars.layouts[name] = _this2.relativeToBuild(_this2.options.srcDir, file);
                  }
                });
                if (!templateVars.components.ErrorPage && hasErrorLayout) {
                  templateVars.components.ErrorPage = this.relativeToBuild(this.options.srcDir, this.options.dir.layouts + '/error.vue');
                }

              case 10:
                if (templateVars.layouts.default) {
                  _context3.next = 15;
                  break;
                }

                _context3.next = 13;
                return mkdirp(r(this.options.buildDir, 'layouts'));

              case 13:
                templatesFiles.push('layouts/default.vue');
                templateVars.layouts.default = './layouts/default.vue';

              case 15:

                // -- Routes --
                debug('Generating routes...');
                // If user defined a custom method to create routes

                if (!this._nuxtPages) {
                  _context3.next = 25;
                  break;
                }

                // Use nuxt.js createRoutes bases on pages/
                files = {};
                _context3.next = 20;
                return glob(this.options.dir.pages + '/**/*.{vue,js}', {
                  cwd: this.options.srcDir,
                  ignore: this.options.ignore
                });

              case 20:
                _context3.t0 = function (f) {
                  var key = f.replace(/\.(js|vue)$/, '');
                  if (/\.vue$/.test(f) || !files[key]) {
                    files[key] = f;
                  }
                };

                _context3.sent.forEach(_context3.t0);

                templateVars.router.routes = createRoutes((0, _values2.default)(files), this.options.srcDir, this.options.dir.pages);
                _context3.next = 26;
                break;

              case 25:
                templateVars.router.routes = this.options.build.createRoutes(this.options.srcDir);

              case 26:
                _context3.next = 28;
                return this.nuxt.callHook('build:extendRoutes', templateVars.router.routes, r);

              case 28:

                // router.extendRoutes method
                if (typeof this.options.router.extendRoutes === 'function') {
                  // let the user extend the routes
                  extendedRoutes = this.options.router.extendRoutes(templateVars.router.routes, r);
                  // Only overwrite routes when something is returned for backwards compatibility

                  if (extendedRoutes !== undefined) {
                    templateVars.router.routes = extendedRoutes;
                  }
                }

                // Make routes accessible for other modules and webpack configs
                this.routes = templateVars.router.routes;

                // -- Store --
                // Add store if needed
                if (this.options.store) {
                  templatesFiles.push('store.js');
                }

                // Resolve template files
                customTemplateFiles = this.options.build.templates.map(function (t) {
                  return t.dst || basename(t.src || t);
                });


                templatesFiles = templatesFiles.map(function (file) {
                  // Skip if custom file was already provided in build.templates[]
                  if (customTemplateFiles.indexOf(file) !== -1) {
                    return;
                  }
                  // Allow override templates using a file with same name in ${srcDir}/app
                  var customPath = r(_this2.options.srcDir, 'app', file);
                  var customFileExists = existsSync(customPath);

                  return {
                    src: customFileExists ? customPath : r(_this2.options.nuxtAppDir, file),
                    dst: file,
                    custom: customFileExists
                  };
                }).filter(function (i) {
                  return !!i;
                });

                // -- Custom templates --
                // Add custom template files
                templatesFiles = templatesFiles.concat(this.options.build.templates.map(function (t) {
                  return (0, _assign2.default)({
                    src: r(_this2.options.srcDir, t.src || t),
                    dst: t.dst || basename(t.src || t),
                    custom: true
                  }, t);
                }));

                // -- Loading indicator --
                if (this.options.loadingIndicator.name) {
                  indicatorPath1 = resolve(this.options.nuxtAppDir, 'views/loading', this.options.loadingIndicator.name + '.html');
                  indicatorPath2 = this.nuxt.resolveAlias(this.options.loadingIndicator.name);
                  indicatorPath = existsSync(indicatorPath1) ? indicatorPath1 : existsSync(indicatorPath2) ? indicatorPath2 : null;

                  if (indicatorPath) {
                    templatesFiles.push({
                      src: indicatorPath,
                      dst: 'loading.html',
                      options: this.options.loadingIndicator
                    });
                  } else {
                    /* istanbul ignore next */
                    // eslint-disable-next-line no-console
                    console.error('Could not fetch loading indicator: ' + this.options.loadingIndicator.name);
                  }
                }

                _context3.next = 37;
                return this.nuxt.callHook('build:templates', {
                  templatesFiles: templatesFiles,
                  templateVars: templateVars,
                  resolve: r
                });

              case 37:
                _context3.next = 39;
                return _promise2.default.all(templatesFiles.map(function () {
                  var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(_ref4) {
                    var src = _ref4.src,
                        dst = _ref4.dst,
                        options = _ref4.options,
                        custom = _ref4.custom;
                    var fileContent, content, template, path;
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            // Add template to watchers
                            _this2.options.build.watch.push(src);
                            // Render template to dst
                            _context2.next = 3;
                            return readFile(src, 'utf8');

                          case 3:
                            fileContent = _context2.sent;
                            content = void 0;
                            _context2.prev = 5;
                            template = _.template(fileContent, {
                              imports: {
                                serialize: serialize,
                                hash: hash,
                                r: r,
                                wp: wp,
                                wChunk: wChunk,
                                resolvePath: _this2.nuxt.resolvePath.bind(_this2.nuxt),
                                resolveAlias: _this2.nuxt.resolveAlias.bind(_this2.nuxt),
                                relativeToBuild: _this2.relativeToBuild
                              }
                            });

                            content = template((0, _assign2.default)({}, templateVars, {
                              options: options || {},
                              custom: custom,
                              src: src,
                              dst: dst
                            }));
                            _context2.next = 13;
                            break;

                          case 10:
                            _context2.prev = 10;
                            _context2.t0 = _context2['catch'](5);
                            throw new Error('Could not compile template ' + src + ': ' + _context2.t0.message);

                          case 13:
                            path = r(_this2.options.buildDir, dst);
                            // Ensure parent dir exits

                            _context2.next = 16;
                            return mkdirp(dirname(path));

                          case 16:
                            _context2.next = 18;
                            return writeFile(path, content, 'utf8');

                          case 18:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this2, [[5, 10]]);
                  }));

                  return function (_x) {
                    return _ref5.apply(this, arguments);
                  };
                }()));

              case 39:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function generateRoutesAndFiles() {
        return _ref3.apply(this, arguments);
      }

      return generateRoutesAndFiles;
    }()
  }, {
    key: 'webpackBuild',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
        var _this3 = this;

        var compilersOptions, clientConfig, serverConfig, sharedFS, sharedCache;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                debug('Building files...');
                compilersOptions = [];

                // Client

                clientConfig = clientWebpackConfig.call(this);

                compilersOptions.push(clientConfig);

                // Server
                serverConfig = null;

                if (this.options.build.ssr) {
                  serverConfig = serverWebpackConfig.call(this);
                  compilersOptions.push(serverConfig);
                }

                // Alias plugins to their real path
                this.plugins.forEach(function (p) {
                  var src = _this3.relativeToBuild(p.src);

                  // Client config
                  if (!clientConfig.resolve.alias[p.name]) {
                    clientConfig.resolve.alias[p.name] = src;
                  }

                  // Server config
                  if (serverConfig && !serverConfig.resolve.alias[p.name]) {
                    // Alias to noop for ssr:false plugins
                    serverConfig.resolve.alias[p.name] = p.ssr ? src : './empty.js';
                  }
                });

                // Make a dll plugin after compile to make nuxt dev builds faster
                if (this.options.build.dll && this.options.dev) {
                  compilersOptions.push(dllWebpackConfig.call(this, clientConfig));
                }

                // Initialize shared FS and Cache
                sharedFS = this.options.dev && new MFS();
                sharedCache = {};

                // Initialize compilers

                this.compilers = compilersOptions.map(function (compilersOption) {
                  var compiler = webpack(compilersOption);
                  // In dev, write files in memory FS (except for DLL)
                  if (sharedFS && !compiler.name.includes('-dll')) {
                    compiler.outputFileSystem = sharedFS;
                  }
                  compiler.cache = sharedCache;
                  return compiler;
                });

                // Start Builds
                _context6.next = 13;
                return sequence(this.compilers, function (compiler) {
                  return new _promise2.default(function () {
                    var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(resolve, reject) {
                      var name;
                      return _regenerator2.default.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              name = compiler.options.name;
                              _context5.next = 3;
                              return _this3.nuxt.callHook('build:compile', { name: name, compiler: compiler });

                            case 3:

                              // Resolve only when compiler emit done event
                              compiler.plugin('done', function () {
                                var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(stats) {
                                  return _regenerator2.default.wrap(function _callee4$(_context4) {
                                    while (1) {
                                      switch (_context4.prev = _context4.next) {
                                        case 0:
                                          _context4.next = 2;
                                          return _this3.nuxt.callHook('build:compiled', {
                                            name: name,
                                            compiler: compiler,
                                            stats: stats
                                          });

                                        case 2:
                                          // Reload renderer if available
                                          _this3.nuxt.renderer.loadResources(sharedFS || require('fs'));
                                          // Resolve on next tick
                                          process.nextTick(resolve);

                                        case 4:
                                        case 'end':
                                          return _context4.stop();
                                      }
                                    }
                                  }, _callee4, _this3);
                                }));

                                return function (_x4) {
                                  return _ref8.apply(this, arguments);
                                };
                              }());
                              // --- Dev Build ---

                              if (!_this3.options.dev) {
                                _context5.next = 12;
                                break;
                              }

                              if (!(compiler.options.name === 'client')) {
                                _context5.next = 7;
                                break;
                              }

                              return _context5.abrupt('return', _this3.webpackDev(compiler));

                            case 7:
                              if (!compiler.options.name.includes('-dll')) {
                                _context5.next = 10;
                                break;
                              }

                              compiler.run(function (err, stats) {
                                if (err) return reject(err);
                                debug('[DLL] updated');
                              });
                              return _context5.abrupt('return');

                            case 10:
                              // Server, build and watch for changes
                              _this3.compilersWatching.push(compiler.watch(_this3.options.watchers.webpack, function (err) {
                                /* istanbul ignore if */
                                if (err) return reject(err);
                              }));
                              return _context5.abrupt('return');

                            case 12:
                              // --- Production Build ---
                              compiler.run(function (err, stats) {
                                /* istanbul ignore if */
                                if (err) {
                                  console.error(err); // eslint-disable-line no-console
                                  return reject(err);
                                }

                                // Show build stats for production
                                console.log(stats.toString(_this3.webpackStats)); // eslint-disable-line no-console

                                /* istanbul ignore if */
                                if (stats.hasErrors()) {
                                  return reject(new Error('Webpack build exited with errors'));
                                }
                              });

                            case 13:
                            case 'end':
                              return _context5.stop();
                          }
                        }
                      }, _callee5, _this3);
                    }));

                    return function (_x2, _x3) {
                      return _ref7.apply(this, arguments);
                    };
                  }());
                });

              case 13:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function webpackBuild() {
        return _ref6.apply(this, arguments);
      }

      return webpackBuild;
    }()
  }, {
    key: 'webpackDev',
    value: function webpackDev(compiler) {
      debug('Adding webpack middleware...');

      // Create webpack dev middleware
      this.webpackDevMiddleware = promisify(webpackDevMiddleware(compiler, (0, _assign2.default)({
        publicPath: this.options.build.publicPath,
        stats: this.webpackStats,
        logLevel: 'silent',
        watchOptions: this.options.watchers.webpack
      }, this.options.build.devMiddleware)));

      this.webpackDevMiddleware.close = promisify(this.webpackDevMiddleware.close);

      this.webpackHotMiddleware = promisify(webpackHotMiddleware(compiler, (0, _assign2.default)({
        log: false,
        heartbeat: 10000
      }, this.options.build.hotMiddleware)));

      // Inject to renderer instance
      if (this.nuxt.renderer) {
        this.nuxt.renderer.webpackDevMiddleware = this.webpackDevMiddleware;
        this.nuxt.renderer.webpackHotMiddleware = this.webpackHotMiddleware;
      }

      // Start watching files
      this.watchFiles();
    }
  }, {
    key: 'watchFiles',
    value: function watchFiles() {
      var _this4 = this;

      var src = this.options.srcDir;
      var patterns = [r(src, this.options.dir.layouts), r(src, this.options.dir.store), r(src, this.options.dir.middleware), r(src, this.options.dir.layouts + '/*.{vue,js}'), r(src, this.options.dir.layouts + '/**/*.{vue,js}')];
      if (this._nuxtPages) {
        patterns.push(r(src, this.options.dir.pages), r(src, this.options.dir.pages + '/*.{vue,js}'), r(src, this.options.dir.pages + '/**/*.{vue,js}'));
      }
      patterns = _.map(patterns, function (p) {
        return upath.normalizeSafe(p);
      });

      var options = (0, _assign2.default)({}, this.options.watchers.chokidar, {
        ignoreInitial: true
      });
      /* istanbul ignore next */
      var refreshFiles = _.debounce(function () {
        return _this4.generateRoutesAndFiles();
      }, 200);

      // Watch for src Files
      this.filesWatcher = chokidar.watch(patterns, options).on('add', refreshFiles).on('unlink', refreshFiles);

      // Watch for custom provided files
      var customPatterns = _.concat.apply(_, [this.options.build.watch].concat((0, _toConsumableArray3.default)(_.values(_.omit(this.options.build.styleResources, ['options'])))));
      customPatterns = _.map(_.uniq(customPatterns), function (p) {
        return upath.normalizeSafe(p);
      });
      this.customFilesWatcher = chokidar.watch(customPatterns, options).on('change', refreshFiles);
    }
  }, {
    key: 'unwatch',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (this.filesWatcher) {
                  this.filesWatcher.close();
                }

                if (this.customFilesWatcher) {
                  this.customFilesWatcher.close();
                }

                this.compilersWatching.forEach(function (watching) {
                  return watching.close();
                });

                // Stop webpack middleware
                _context7.next = 5;
                return this.webpackDevMiddleware.close();

              case 5:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function unwatch() {
        return _ref9.apply(this, arguments);
      }

      return unwatch;
    }()

    // TODO: remove ignore when generateConfig enabled again

  }, {
    key: 'generateConfig',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
        var config, options;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                config = resolve(this.options.buildDir, 'build.config.js');
                options = _.omit(this.options, Options.unsafeKeys);
                _context8.next = 4;
                return writeFile(config, 'module.exports = ' + (0, _stringify2.default)(options, null, '  '), 'utf8');

              case 4:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function generateConfig() {
        return _ref10.apply(this, arguments);
      }

      return generateConfig;
    }()
  }, {
    key: 'plugins',
    get: function get() {
      var _this5 = this;

      return _.uniqBy(this.options.plugins.map(function (p, i) {
        if (typeof p === 'string') p = { src: p };
        var pluginBaseName = basename(p.src, extname(p.src)).replace(/[^a-zA-Z?\d\s:]/g, '');
        return {
          src: _this5.nuxt.resolveAlias(p.src),
          ssr: p.ssr !== false,
          name: 'nuxt_plugin_' + pluginBaseName + '_' + hash(p.src)
        };
      }), function (p) {
        return p.name;
      });
    }
  }]);
  return Builder;
}();

var STATUS = {
  INITIAL: 1,
  BUILD_DONE: 2,
  BUILDING: 3
};