'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

var ansiHTML = require('ansi-html');
var serialize = require('serialize-javascript');
var serveStatic = require('serve-static');
var compression = require('compression');
var _ = require('lodash');

var _require = require('path'),
    join = _require.join,
    resolve = _require.resolve;

var fs = require('fs-extra');

var _require2 = require('vue-server-renderer'),
    createBundleRenderer = _require2.createBundleRenderer;

var Debug = require('debug');
var connect = require('connect');
var launchMiddleware = require('launch-editor-middleware');
var crypto = require('crypto');

var _require3 = require('../common/utils'),
    setAnsiColors = _require3.setAnsiColors,
    isUrl = _require3.isUrl,
    waitFor = _require3.waitFor;

var _require4 = require('../common'),
    Options = _require4.Options;

var MetaRenderer = require('./meta');
var errorMiddleware = require('./middleware/error');
var nuxtMiddleware = require('./middleware/nuxt');

var debug = Debug('nuxt:render');
debug.color = 4; // Force blue color

setAnsiColors(ansiHTML);

var jsdom = null;

module.exports = function () {
  function Renderer(nuxt) {
    (0, _classCallCheck3.default)(this, Renderer);

    this.nuxt = nuxt;
    this.options = nuxt.options;

    // Will be set by createRenderer
    this.bundleRenderer = null;
    this.metaRenderer = null;

    // Will be available on dev
    this.webpackDevMiddleware = null;
    this.webpackHotMiddleware = null;

    // Create new connect instance
    this.app = connect();

    // Renderer runtime resources
    this.resources = {
      clientManifest: null,
      serverBundle: null,
      ssrTemplate: null,
      spaTemplate: null,
      errorTemplate: parseTemplate('Nuxt.js Internal Server Error')
    };
  }

  (0, _createClass3.default)(Renderer, [{
    key: 'ready',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.nuxt.callHook('render:before', this, this.options.render);

              case 2:
                _context.next = 4;
                return this.setupMiddleware();

              case 4:
                if (this.options.dev) {
                  _context.next = 7;
                  break;
                }

                _context.next = 7;
                return this.loadResources();

              case 7:
                _context.next = 9;
                return this.nuxt.callHook('render:done', this);

              case 9:
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
    key: 'loadResources',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var _this = this;

        var _fs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : fs;

        var distPath, updated, errorTemplatePath, loadingHTMLPath;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                distPath = resolve(this.options.buildDir, 'dist');
                updated = [];


                resourceMap.forEach(function (_ref3) {
                  var key = _ref3.key,
                      fileName = _ref3.fileName,
                      transform = _ref3.transform;

                  var rawKey = '$$' + key;
                  var path = join(distPath, fileName);

                  var rawData = void 0,
                      data = void 0;
                  if (!_fs.existsSync(path)) {
                    return; // Resource not exists
                  }
                  rawData = _fs.readFileSync(path, 'utf8');
                  if (!rawData || rawData === _this.resources[rawKey]) {
                    return; // No changes
                  }
                  _this.resources[rawKey] = rawData;
                  data = transform(rawData);
                  /* istanbul ignore if */
                  if (!data) {
                    return; // Invalid data ?
                  }
                  _this.resources[key] = data;
                  updated.push(key);
                });

                // Reload error template
                errorTemplatePath = resolve(this.options.buildDir, 'views/error.html');

                if (fs.existsSync(errorTemplatePath)) {
                  this.resources.errorTemplate = parseTemplate(fs.readFileSync(errorTemplatePath, 'utf8'));
                }

                // Load loading template
                loadingHTMLPath = resolve(this.options.buildDir, 'loading.html');

                if (fs.existsSync(loadingHTMLPath)) {
                  this.resources.loadingHTML = fs.readFileSync(loadingHTMLPath, 'utf8');
                  this.resources.loadingHTML = this.resources.loadingHTML.replace(/[\r|\n]/g, '');
                } else {
                  this.resources.loadingHTML = '';
                }

                // Call resourcesLoaded plugin
                _context2.next = 9;
                return this.nuxt.callHook('render:resourcesLoaded', this.resources);

              case 9:

                if (updated.length > 0) {
                  this.createRenderer();
                }

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadResources() {
        return _ref2.apply(this, arguments);
      }

      return loadResources;
    }()
  }, {
    key: 'createRenderer',
    value: function createRenderer() {
      // Ensure resources are available
      if (!this.isResourcesAvailable) {
        return;
      }

      // Create Meta Renderer
      this.metaRenderer = new MetaRenderer(this.nuxt, this);

      // Skip following steps if noSSR mode
      if (this.noSSR) {
        return;
      }

      // Create bundle renderer for SSR
      this.bundleRenderer = createBundleRenderer(this.resources.serverBundle, (0, _assign2.default)({
        clientManifest: this.resources.clientManifest,
        runInNewContext: false,
        basedir: this.options.rootDir
      }, this.options.render.bundleRenderer));
    }
  }, {
    key: 'useMiddleware',
    value: function useMiddleware(m) {
      // Resolve
      var $m = m;
      var src = void 0;
      if (typeof m === 'string') {
        src = this.nuxt.resolvePath(m);
        m = require(src);
      }
      if (typeof m.handler === 'string') {
        src = this.nuxt.resolvePath(m.handler);
        m.handler = require(src);
      }

      var handler = m.handler || m;
      var path = ((m.prefix !== false ? this.options.router.base : '') + (typeof m.path === 'string' ? m.path : '')).replace(/\/\//g, '/');

      // Inject $src and $m to final handler
      if (src) handler.$src = src;
      handler.$m = $m;

      // Use middleware
      this.app.use(path, handler);
    }
  }, {
    key: 'setupMiddleware',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
        var _this2 = this;

        var staticMiddleware, distDir;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.nuxt.callHook('render:setupMiddleware', this.app);

              case 2:

                // Gzip middleware for production
                if (!this.options.dev && this.options.render.gzip) {
                  this.useMiddleware(compression(this.options.render.gzip));
                }

                // Common URL checks
                this.useMiddleware(function (req, res, next) {
                  // Prevent access to SSR resources
                  if (ssrResourceRegex.test(req.url)) {
                    res.statusCode = 404;
                    return res.end();
                  }
                  next();
                });

                // Add webpack middleware only for development
                if (this.options.dev) {
                  this.useMiddleware(function () {
                    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res, next) {
                      return _regenerator2.default.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              if (!_this2.webpackDevMiddleware) {
                                _context3.next = 3;
                                break;
                              }

                              _context3.next = 3;
                              return _this2.webpackDevMiddleware(req, res);

                            case 3:
                              if (!_this2.webpackHotMiddleware) {
                                _context3.next = 6;
                                break;
                              }

                              _context3.next = 6;
                              return _this2.webpackHotMiddleware(req, res);

                            case 6:
                              next();

                            case 7:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, _this2);
                    }));

                    return function (_x2, _x3, _x4) {
                      return _ref5.apply(this, arguments);
                    };
                  }());
                }

                // open in editor for debug mode only
                if (this.options.debug && this.options.dev) {
                  this.useMiddleware({
                    path: '__open-in-editor',
                    handler: launchMiddleware(this.options.editor)
                  });
                }

                // For serving static/ files to /
                staticMiddleware = serveStatic(resolve(this.options.srcDir, this.options.dir.static), this.options.render.static);

                staticMiddleware.prefix = this.options.render.static.prefix;
                this.useMiddleware(staticMiddleware);

                // Serve .nuxt/dist/ files only for production
                // For dev they will be served with devMiddleware
                if (!this.options.dev) {
                  distDir = resolve(this.options.buildDir, 'dist');

                  this.useMiddleware({
                    path: this.publicPath,
                    handler: serveStatic(distDir, {
                      index: false, // Don't serve index.html template
                      maxAge: '1y' // 1 year in production
                    })
                  });
                }

                // Add User provided middleware
                this.options.serverMiddleware.forEach(function (m) {
                  _this2.useMiddleware(m);
                });

                // Finally use nuxtMiddleware
                this.useMiddleware(nuxtMiddleware.bind(this));

                // Error middleware for errors that occurred in middleware that declared above
                // Middleware should exactly take 4 arguments
                // https://github.com/senchalabs/connect#error-middleware

                // Apply errorMiddleware from modules first
                _context4.next = 14;
                return this.nuxt.callHook('render:errorMiddleware', this.app);

              case 14:

                // Apply errorMiddleware from Nuxt
                this.useMiddleware(errorMiddleware.bind(this));

              case 15:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function setupMiddleware() {
        return _ref4.apply(this, arguments);
      }

      return setupMiddleware;
    }()
  }, {
    key: 'renderRoute',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(url) {
        var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var spa, ENV, _ref7, HTML_ATTRS, BODY_ATTRS, _HEAD, BODY_SCRIPTS, getPreloadFiles, _APP, err, _html, APP, m, HEAD, serializedSession, cspScriptSrcHashes, hash, html;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (this.isReady) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return waitFor(1000);

              case 3:
                return _context5.abrupt('return', this.renderRoute(url, context));

              case 4:

                // Log rendered url
                debug('Rendering url ' + url);

                // Add url and isSever to the context
                context.url = url;

                // Basic response if SSR is disabled or spa data provided
                spa = context.spa || context.res && context.res.spa;
                ENV = this.options.env;

                if (!(this.noSSR || spa)) {
                  _context5.next = 23;
                  break;
                }

                _context5.next = 11;
                return this.metaRenderer.render(context);

              case 11:
                _ref7 = _context5.sent;
                HTML_ATTRS = _ref7.HTML_ATTRS;
                BODY_ATTRS = _ref7.BODY_ATTRS;
                _HEAD = _ref7.HEAD;
                BODY_SCRIPTS = _ref7.BODY_SCRIPTS;
                getPreloadFiles = _ref7.getPreloadFiles;
                _APP = '<div id="__nuxt">' + this.resources.loadingHTML + '</div>' + BODY_SCRIPTS;

                // Detect 404 errors

                if (!(url.includes(this.options.build.publicPath) || url.includes('__webpack'))) {
                  _context5.next = 21;
                  break;
                }

                err = {
                  statusCode: 404,
                  message: this.options.messages.error_404,
                  name: 'ResourceNotFound'
                };
                throw err;

              case 21:
                _html = this.resources.spaTemplate({
                  HTML_ATTRS: HTML_ATTRS,
                  BODY_ATTRS: BODY_ATTRS,
                  HEAD: _HEAD,
                  APP: _APP,
                  ENV: ENV
                });
                return _context5.abrupt('return', { html: _html, getPreloadFiles: getPreloadFiles });

              case 23:
                _context5.next = 25;
                return this.bundleRenderer.renderToString(context);

              case 25:
                APP = _context5.sent;


                if (!context.nuxt.serverRendered) {
                  APP = '<div id="__nuxt"></div>';
                }
                m = context.meta.inject();
                HEAD = m.meta.text() + m.title.text() + m.link.text() + m.style.text() + m.script.text() + m.noscript.text();

                if (this.options._routerBaseSpecified) {
                  HEAD += '<base href="' + this.options.router.base + '">';
                }

                if (this.options.render.resourceHints) {
                  HEAD += context.renderResourceHints();
                }

                serializedSession = 'window.__NUXT__=' + serialize(context.nuxt, {
                  isJSON: true
                }) + ';';
                cspScriptSrcHashes = [];

                if (this.options.render.csp && this.options.render.csp.enabled) {
                  hash = crypto.createHash(this.options.render.csp.hashAlgorithm);

                  hash.update(serializedSession);
                  cspScriptSrcHashes.push('\'' + this.options.render.csp.hashAlgorithm + '-' + hash.digest('base64') + '\'');
                }

                APP += '<script type="text/javascript">' + serializedSession + '</script>';
                APP += context.renderScripts();
                APP += m.script.text({ body: true });
                APP += m.noscript.text({ body: true });

                HEAD += context.renderStyles();

                html = this.resources.ssrTemplate({
                  HTML_ATTRS: 'data-n-head-ssr ' + m.htmlAttrs.text(),
                  BODY_ATTRS: m.bodyAttrs.text(),
                  HEAD: HEAD,
                  APP: APP,
                  ENV: ENV
                });
                return _context5.abrupt('return', {
                  html: html,
                  cspScriptSrcHashes: cspScriptSrcHashes,
                  getPreloadFiles: context.getPreloadFiles,
                  error: context.nuxt.error,
                  redirected: context.redirected
                });

              case 41:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function renderRoute(_x6) {
        return _ref6.apply(this, arguments);
      }

      return renderRoute;
    }()
  }, {
    key: 'renderAndGetWindow',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(url) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var options, _ref9, window, nuxtExists, error;

        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (jsdom) {
                  _context6.next = 11;
                  break;
                }

                _context6.prev = 1;

                jsdom = require('jsdom');
                _context6.next = 11;
                break;

              case 5:
                _context6.prev = 5;
                _context6.t0 = _context6['catch'](1);

                /* eslint-disable no-console */
                console.error('Fail when calling nuxt.renderAndGetWindow(url)');
                console.error('jsdom module is not installed');
                console.error('Please install jsdom with: npm install --save-dev jsdom');
                /* eslint-enable no-console */
                throw _context6.t0;

              case 11:
                options = {
                  resources: 'usable', // load subresources (https://github.com/tmpvar/jsdom#loading-subresources)
                  runScripts: 'dangerously',
                  beforeParse: function beforeParse(window) {
                    // Mock window.scrollTo
                    window.scrollTo = function () {};
                  }
                };

                if (opts.virtualConsole !== false) {
                  options.virtualConsole = new jsdom.VirtualConsole().sendTo(console);
                }
                url = url || 'http://localhost:3000';
                _context6.next = 16;
                return jsdom.JSDOM.fromURL(url, options);

              case 16:
                _ref9 = _context6.sent;
                window = _ref9.window;

                // If Nuxt could not be loaded (error from the server-side)
                nuxtExists = window.document.body.innerHTML.includes(this.options.render.ssr ? 'window.__NUXT__' : '<div id="__nuxt">');
                /* istanbul ignore if */

                if (nuxtExists) {
                  _context6.next = 23;
                  break;
                }

                error = new Error('Could not load the nuxt app');

                error.body = window.document.body.innerHTML;
                throw error;

              case 23:
                _context6.next = 25;
                return new _promise2.default(function (resolve) {
                  window._onNuxtLoaded = function () {
                    return resolve(window);
                  };
                });

              case 25:
                return _context6.abrupt('return', window);

              case 26:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[1, 5]]);
      }));

      function renderAndGetWindow(_x8) {
        return _ref8.apply(this, arguments);
      }

      return renderAndGetWindow;
    }()
  }, {
    key: 'noSSR',
    get: function get() {
      return this.options.render.ssr === false;
    }
  }, {
    key: 'isReady',
    get: function get() {
      if (this.noSSR) {
        return Boolean(this.resources.spaTemplate);
      }

      return Boolean(this.bundleRenderer && this.resources.ssrTemplate);
    }
  }, {
    key: 'isResourcesAvailable',
    get: function get() {
      // Required for both
      /* istanbul ignore if */
      if (!this.resources.clientManifest) {
        return false;
      }

      // Required for SPA rendering
      if (this.noSSR) {
        return Boolean(this.resources.spaTemplate);
      }

      // Required for bundle renderer
      return Boolean(this.resources.ssrTemplate && this.resources.serverBundle);
    }
  }, {
    key: 'publicPath',
    get: function get() {
      return isUrl(this.options.build.publicPath) ? Options.defaults.build.publicPath : this.options.build.publicPath;
    }
  }]);
  return Renderer;
}();

var parseTemplate = function parseTemplate(templateStr) {
  return _.template(templateStr, {
    interpolate: /{{([\s\S]+?)}}/g
  });
};

var resourceMap = [{
  key: 'clientManifest',
  fileName: 'vue-ssr-client-manifest.json',
  transform: JSON.parse
}, {
  key: 'serverBundle',
  fileName: 'server-bundle.json',
  transform: JSON.parse
}, {
  key: 'ssrTemplate',
  fileName: 'index.ssr.html',
  transform: parseTemplate
}, {
  key: 'spaTemplate',
  fileName: 'index.spa.html',
  transform: parseTemplate
}];

// Protector utility against request to SSR bundle files
var ssrResourceRegex = new RegExp(resourceMap.map(function (resource) {
  return resource.fileName;
}).join('|'), 'i');