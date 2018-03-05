'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ansiHTML = require('ansi-html');
const serialize = require('serialize-javascript');
const serveStatic = require('serve-static');
const compression = require('compression');
const _ = require('lodash');
const { join, resolve } = require('path');
const fs = require('fs-extra');
const { createBundleRenderer } = require('vue-server-renderer');
const Debug = require('debug');
const connect = require('connect');
const launchMiddleware = require('launch-editor-middleware');
const crypto = require('crypto');

const { setAnsiColors, isUrl, waitFor } = require('../common/utils');
const { Options } = require('../common');

const MetaRenderer = require('./meta');
const errorMiddleware = require('./middleware/error');
const nuxtMiddleware = require('./middleware/nuxt');

const debug = Debug('nuxt:render');
debug.color = 4; // Force blue color

setAnsiColors(ansiHTML);

let jsdom = null;

module.exports = class Renderer {
  constructor(nuxt) {
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

  ready() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _this.nuxt.callHook('render:before', _this, _this.options.render);
      // Setup nuxt middleware
      yield _this.setupMiddleware();

      // Production: Load SSR resources from fs
      if (!_this.options.dev) {
        yield _this.loadResources();
      }

      // Call done hook
      yield _this.nuxt.callHook('render:done', _this);
    })();
  }

  loadResources(_fs = fs) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let distPath = resolve(_this2.options.buildDir, 'dist');
      let updated = [];

      resourceMap.forEach(function ({ key, fileName, transform }) {
        let rawKey = '$$' + key;
        const path = join(distPath, fileName);

        let rawData, data;
        if (!_fs.existsSync(path)) {
          return; // Resource not exists
        }
        rawData = _fs.readFileSync(path, 'utf8');
        if (!rawData || rawData === _this2.resources[rawKey]) {
          return; // No changes
        }
        _this2.resources[rawKey] = rawData;
        data = transform(rawData);
        /* istanbul ignore if */
        if (!data) {
          return; // Invalid data ?
        }
        _this2.resources[key] = data;
        updated.push(key);
      });

      // Reload error template
      const errorTemplatePath = resolve(_this2.options.buildDir, 'views/error.html');
      if (fs.existsSync(errorTemplatePath)) {
        _this2.resources.errorTemplate = parseTemplate(fs.readFileSync(errorTemplatePath, 'utf8'));
      }

      // Load loading template
      const loadingHTMLPath = resolve(_this2.options.buildDir, 'loading.html');
      if (fs.existsSync(loadingHTMLPath)) {
        _this2.resources.loadingHTML = fs.readFileSync(loadingHTMLPath, 'utf8');
        _this2.resources.loadingHTML = _this2.resources.loadingHTML.replace(/[\r|\n]/g, '');
      } else {
        _this2.resources.loadingHTML = '';
      }

      // Call resourcesLoaded plugin
      yield _this2.nuxt.callHook('render:resourcesLoaded', _this2.resources);

      if (updated.length > 0) {
        _this2.createRenderer();
      }
    })();
  }

  get noSSR() {
    return this.options.render.ssr === false;
  }

  get isReady() {
    if (this.noSSR) {
      return Boolean(this.resources.spaTemplate);
    }

    return Boolean(this.bundleRenderer && this.resources.ssrTemplate);
  }

  get isResourcesAvailable() {
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

  createRenderer() {
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

  useMiddleware(m) {
    // Resolve
    const $m = m;
    let src;
    if (typeof m === 'string') {
      src = this.nuxt.resolvePath(m);
      m = require(src);
    }
    if (typeof m.handler === 'string') {
      src = this.nuxt.resolvePath(m.handler);
      m.handler = require(src);
    }

    const handler = m.handler || m;
    const path = ((m.prefix !== false ? this.options.router.base : '') + (typeof m.path === 'string' ? m.path : '')).replace(/\/\//g, '/');

    // Inject $src and $m to final handler
    if (src) handler.$src = src;
    handler.$m = $m;

    // Use middleware
    this.app.use(path, handler);
  }

  get publicPath() {
    return isUrl(this.options.build.publicPath) ? Options.defaults.build.publicPath : this.options.build.publicPath;
  }

  setupMiddleware() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Apply setupMiddleware from modules first
      yield _this3.nuxt.callHook('render:setupMiddleware', _this3.app);

      // Gzip middleware for production
      if (!_this3.options.dev && _this3.options.render.gzip) {
        _this3.useMiddleware(compression(_this3.options.render.gzip));
      }

      // Common URL checks
      _this3.useMiddleware(function (req, res, next) {
        // Prevent access to SSR resources
        if (ssrResourceRegex.test(req.url)) {
          res.statusCode = 404;
          return res.end();
        }
        next();
      });

      // Add webpack middleware only for development
      if (_this3.options.dev) {
        _this3.useMiddleware((() => {
          var _ref = (0, _asyncToGenerator3.default)(function* (req, res, next) {
            if (_this3.webpackDevMiddleware) {
              yield _this3.webpackDevMiddleware(req, res);
            }
            if (_this3.webpackHotMiddleware) {
              yield _this3.webpackHotMiddleware(req, res);
            }
            next();
          });

          return function (_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        })());
      }

      // open in editor for debug mode only
      if (_this3.options.debug && _this3.options.dev) {
        _this3.useMiddleware({
          path: '__open-in-editor',
          handler: launchMiddleware(_this3.options.editor)
        });
      }

      // For serving static/ files to /
      _this3.useMiddleware(serveStatic(resolve(_this3.options.srcDir, 'static'), _this3.options.render.static));

      // Serve .nuxt/dist/ files only for production
      // For dev they will be served with devMiddleware
      if (!_this3.options.dev) {
        const distDir = resolve(_this3.options.buildDir, 'dist');
        _this3.useMiddleware({
          path: _this3.publicPath,
          handler: serveStatic(distDir, {
            index: false, // Don't serve index.html template
            maxAge: '1y' // 1 year in production
          })
        });
      }

      // Add User provided middleware
      _this3.options.serverMiddleware.forEach(function (m) {
        _this3.useMiddleware(m);
      });

      // Finally use nuxtMiddleware
      _this3.useMiddleware(nuxtMiddleware.bind(_this3));

      // Error middleware for errors that occurred in middleware that declared above
      // Middleware should exactly take 4 arguments
      // https://github.com/senchalabs/connect#error-middleware

      // Apply errorMiddleware from modules first
      yield _this3.nuxt.callHook('render:errorMiddleware', _this3.app);

      // Apply errorMiddleware from Nuxt
      _this3.useMiddleware(errorMiddleware.bind(_this3));
    })();
  }

  renderRoute(url, context = {}) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      /* istanbul ignore if */
      if (!_this4.isReady) {
        yield waitFor(1000);
        return _this4.renderRoute(url, context);
      }

      // Log rendered url
      debug(`Rendering url ${url}`);

      // Add url and isSever to the context
      context.url = url;

      // Basic response if SSR is disabled or spa data provided
      const spa = context.spa || context.res && context.res.spa;
      const ENV = _this4.options.env;

      if (_this4.noSSR || spa) {
        const {
          HTML_ATTRS,
          BODY_ATTRS,
          HEAD,
          BODY_SCRIPTS,
          getPreloadFiles
        } = yield _this4.metaRenderer.render(context);
        const APP = `<div id="__nuxt">${_this4.resources.loadingHTML}</div>` + BODY_SCRIPTS;

        // Detect 404 errors
        if (url.includes(_this4.options.build.publicPath) || url.includes('__webpack')) {
          const err = {
            statusCode: 404,
            message: _this4.options.messages.error_404,
            name: 'ResourceNotFound'
          };
          throw err;
        }

        const html = _this4.resources.spaTemplate({
          HTML_ATTRS,
          BODY_ATTRS,
          HEAD,
          APP,
          ENV
        });

        return { html, getPreloadFiles };
      }

      // Call renderToString from the bundleRenderer and generate the HTML (will update the context as well)
      let APP = yield _this4.bundleRenderer.renderToString(context);

      if (!context.nuxt.serverRendered) {
        APP = '<div id="__nuxt"></div>';
      }
      const m = context.meta.inject();
      let HEAD = m.meta.text() + m.title.text() + m.link.text() + m.style.text() + m.script.text() + m.noscript.text();
      if (_this4.options._routerBaseSpecified) {
        HEAD += `<base href="${_this4.options.router.base}">`;
      }

      if (_this4.options.render.resourceHints) {
        HEAD += context.renderResourceHints();
      }

      const serializedSession = `window.__NUXT__=${serialize(context.nuxt, {
        isJSON: true
      })};`;

      const cspScriptSrcHashes = [];
      if (_this4.options.render.csp && _this4.options.render.csp.enabled) {
        let hash = crypto.createHash(_this4.options.render.csp.hashAlgorithm);
        hash.update(serializedSession);
        cspScriptSrcHashes.push(`'${_this4.options.render.csp.hashAlgorithm}-${hash.digest('base64')}'`);
      }

      APP += `<script type="text/javascript">${serializedSession}</script>`;
      APP += context.renderScripts();
      APP += m.script.text({ body: true });
      APP += m.noscript.text({ body: true });

      HEAD += context.renderStyles();

      let html = _this4.resources.ssrTemplate({
        HTML_ATTRS: 'data-n-head-ssr ' + m.htmlAttrs.text(),
        BODY_ATTRS: m.bodyAttrs.text(),
        HEAD,
        APP,
        ENV
      });

      return {
        html,
        cspScriptSrcHashes,
        getPreloadFiles: context.getPreloadFiles,
        error: context.nuxt.error,
        redirected: context.redirected
      };
    })();
  }

  renderAndGetWindow(url, opts = {}) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      /* istanbul ignore if */
      if (!jsdom) {
        try {
          jsdom = require('jsdom');
        } catch (e) /* istanbul ignore next */{
          /* eslint-disable no-console */
          console.error('Fail when calling nuxt.renderAndGetWindow(url)');
          console.error('jsdom module is not installed');
          console.error('Please install jsdom with: npm install --save-dev jsdom');
          /* eslint-enable no-console */
          throw e;
        }
      }
      let options = {
        resources: 'usable', // load subresources (https://github.com/tmpvar/jsdom#loading-subresources)
        runScripts: 'dangerously',
        beforeParse(window) {
          // Mock window.scrollTo
          window.scrollTo = () => {};
        }
      };
      if (opts.virtualConsole !== false) {
        options.virtualConsole = new jsdom.VirtualConsole().sendTo(console);
      }
      url = url || 'http://localhost:3000';
      const { window } = yield jsdom.JSDOM.fromURL(url, options);
      // If Nuxt could not be loaded (error from the server-side)
      const nuxtExists = window.document.body.innerHTML.includes(_this5.options.render.ssr ? 'window.__NUXT__' : '<div id="__nuxt">');
      /* istanbul ignore if */
      if (!nuxtExists) {
        let error = new Error('Could not load the nuxt app');
        error.body = window.document.body.innerHTML;
        throw error;
      }
      // Used by nuxt.js to say when the components are loaded and the app ready
      yield new _promise2.default(function (resolve) {
        window._onNuxtLoaded = function () {
          return resolve(window);
        };
      });
      // Send back window object
      return window;
    })();
  }
};

const parseTemplate = templateStr => _.template(templateStr, {
  interpolate: /{{([\s\S]+?)}}/g
});

const resourceMap = [{
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
const ssrResourceRegex = new RegExp(resourceMap.map(resource => resource.fileName).join('|'), 'i');