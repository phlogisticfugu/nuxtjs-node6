'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  copy,
  remove,
  writeFile,
  mkdirp,
  removeSync,
  existsSync
} = require('fs-extra');
const _ = require('lodash');
const { resolve, join, dirname, sep } = require('path');
const { minify } = require('html-minifier');
const Chalk = require('chalk');

const {
  isUrl,
  promisifyRoute,
  waitFor,
  flatRoutes,
  pe
} = require('../common/utils');

module.exports = class Generator {
  constructor(nuxt, builder) {
    this.nuxt = nuxt;
    this.options = nuxt.options;
    this.builder = builder;

    // Set variables
    this.staticRoutes = resolve(this.options.srcDir, 'static');
    this.srcBuiltPath = resolve(this.options.buildDir, 'dist');
    this.distPath = resolve(this.options.rootDir, this.options.generate.dir);
    this.distNuxtPath = join(this.distPath, isUrl(this.options.build.publicPath) ? '' : this.options.build.publicPath);
  }

  generate({ build = true, init = true } = {}) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _this.initiate({ build, init });

      const routes = yield _this.initRoutes();

      const errors = yield _this.generateRoutes(routes);
      yield _this.afterGenerate();

      // Done hook
      yield _this.nuxt.callHook('generate:done', _this, errors);

      return { errors };
    })();
  }

  initiate({ build = true, init = true } = {}) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Wait for nuxt be ready
      yield _this2.nuxt.ready();

      // Call before hook
      yield _this2.nuxt.callHook('generate:before', _this2, _this2.options.generate);

      if (build) {
        // Add flag to set process.static
        _this2.builder.forGenerate();

        // Start build process
        yield _this2.builder.build();
      }

      // Initialize dist directory
      if (init) {
        yield _this2.initDist();
      }
    })();
  }

  initRoutes(...args) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Resolve config.generate.routes promises before generating the routes
      let generateRoutes = [];
      if (_this3.options.router.mode !== 'hash') {
        try {
          generateRoutes = yield promisifyRoute(_this3.options.generate.routes || [], ...args);
        } catch (e) {
          console.error('Could not resolve routes'); // eslint-disable-line no-console
          throw e; // eslint-disable-line no-unreachable
        }
      }
      // Generate only index.html for router.mode = 'hash'
      let routes = _this3.options.router.mode === 'hash' ? ['/'] : flatRoutes(_this3.options.router.routes);
      routes = _this3.decorateWithPayloads(routes, generateRoutes);

      // extendRoutes hook
      yield _this3.nuxt.callHook('generate:extendRoutes', routes);

      return routes;
    })();
  }

  generateRoutes(routes) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let errors = [];

      // Start generate process
      while (routes.length) {
        let n = 0;
        yield _promise2.default.all(routes.splice(0, _this4.options.generate.concurrency).map((() => {
          var _ref = (0, _asyncToGenerator3.default)(function* ({ route, payload }) {
            yield waitFor(n++ * _this4.options.generate.interval);
            yield _this4.generateRoute({ route, payload, errors });
          });

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        })()));
      }

      // Improve string representation for errors
      errors.toString = function () {
        return _this4._formatErrors(errors);
      };

      return errors;
    })();
  }

  _formatErrors(errors) {
    return errors.map(({ type, route, error }) => {
      const isHandled = type === 'handled';
      const bgColor = isHandled ? 'bgYellow' : 'bgRed';
      const color = isHandled ? 'yellow' : 'red';

      let line = Chalk.black[bgColor](' ROUTE ') + Chalk[color](` ${route}\n\n`);

      if (isHandled) {
        line += Chalk.grey((0, _stringify2.default)(error, undefined, 2) + '\n');
      } else {
        line += Chalk.grey(pe.render(error));
      }

      return line;
    }).join('\n');
  }

  afterGenerate() {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const indexPath = join(_this5.distPath, 'index.html');
      if (existsSync(indexPath)) {
        // Copy /index.html to /200.html for surge SPA
        // https://surge.sh/help/adding-a-200-page-for-client-side-routing
        const _200Path = join(_this5.distPath, '200.html');
        if (!existsSync(_200Path)) {
          yield copy(indexPath, _200Path);
        }
      }
    })();
  }

  initDist() {
    var _this6 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Clean destination folder
      yield remove(_this6.distPath);

      yield _this6.nuxt.callHook('generate:distRemoved', _this6);

      // Copy static and built files
      /* istanbul ignore if */
      if (existsSync(_this6.staticRoutes)) {
        yield copy(_this6.staticRoutes, _this6.distPath);
      }
      yield copy(_this6.srcBuiltPath, _this6.distNuxtPath);

      // Add .nojekyll file to let Github Pages add the _nuxt/ folder
      // https://help.github.com/articles/files-that-start-with-an-underscore-are-missing/
      const nojekyllPath = resolve(_this6.distPath, '.nojekyll');
      writeFile(nojekyllPath, '');

      // Cleanup SSR related files
      const extraFiles = ['index.spa.html', 'index.ssr.html', 'server-bundle.json', 'vue-ssr-client-manifest.json'].map(function (file) {
        return resolve(_this6.distNuxtPath, file);
      });

      extraFiles.forEach(function (file) {
        if (existsSync(file)) {
          removeSync(file);
        }
      });

      yield _this6.nuxt.callHook('generate:distCopied', _this6);
    })();
  }

  decorateWithPayloads(routes, generateRoutes) {
    let routeMap = {};
    // Fill routeMap for known routes
    routes.forEach(route => {
      routeMap[route] = {
        route,
        payload: null
      };
    });
    // Fill routeMap with given generate.routes
    generateRoutes.forEach(route => {
      // route is either a string or like { route : '/my_route/1', payload: {} }
      const path = _.isString(route) ? route : route.route;
      routeMap[path] = {
        route: path,
        payload: route.payload || null
      };
    });
    return _.values(routeMap);
  }

  generateRoute({ route, payload = {}, errors = [] }) {
    var _this7 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let html;
      const pageErrors = [];

      try {
        const res = yield _this7.nuxt.renderer.renderRoute(route, {
          _generate: true,
          payload
        });
        html = res.html;
        if (res.error) {
          pageErrors.push({ type: 'handled', route, error: res.error });
        }
      } catch (err) {
        /* istanbul ignore next */
        pageErrors.push({ type: 'unhandled', route, error: err });
        Array.prototype.push.apply(errors, pageErrors);

        yield _this7.nuxt.callHook('generate:routeFailed', {
          route,
          errors: pageErrors
        });

        return false;
      }

      if (_this7.options.generate.minify) {
        try {
          html = minify(html, _this7.options.generate.minify);
        } catch (err) /* istanbul ignore next */{
          const minifyErr = new Error(`HTML minification failed. Make sure the route generates valid HTML. Failed HTML:\n ${html}`);
          pageErrors.push({ type: 'unhandled', route, error: minifyErr });
        }
      }

      let path;

      if (_this7.options.generate.subFolders) {
        path = join(route, sep, 'index.html'); // /about -> /about/index.html
        path = path === '/404/index.html' ? '/404.html' : path; // /404 -> /404.html
      } else {
        path = route.length > 1 ? join(sep, route + '.html') : join(sep, 'index.html');
      }

      // Call hook to let user update the path & html
      const page = { route, path, html };
      yield _this7.nuxt.callHook('generate:page', page);

      page.path = join(_this7.distPath, page.path);

      // Make sure the sub folders are created
      yield mkdirp(dirname(page.path));
      yield writeFile(page.path, page.html, 'utf8');

      yield _this7.nuxt.callHook('generate:routeCreated', {
        route,
        path: page.path,
        errors: pageErrors
      });

      if (pageErrors.length) {
        Array.prototype.push.apply(errors, pageErrors);
      }

      return true;
    })();
  }
};