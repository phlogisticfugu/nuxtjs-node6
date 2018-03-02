'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Debug = require('debug');
const enableDestroy = require('server-destroy');
const Module = require('module');
const { isPlainObject } = require('lodash');
const chalk = require('chalk');
const { Options } = require('../common');
const { sequence } = require('../common/utils');
const { join, resolve } = require('path');
const { version } = require('../../package.json');
const ModuleContainer = require('./module');
const Renderer = require('./renderer');

const debug = Debug('nuxt:');
debug.color = 5;

module.exports = class Nuxt {
  constructor(options = {}) {
    this.options = Options.from(options);

    this.initialized = false;
    this.errorHandler = this.errorHandler.bind(this);

    // Hooks
    this._hooks = {};
    this.hook = this.hook.bind(this);

    // Create instance of core components
    this.moduleContainer = new ModuleContainer(this);
    this.renderer = new Renderer(this);

    // Backward compatibility
    this.render = this.renderer.app;
    this.renderRoute = this.renderer.renderRoute.bind(this.renderer);
    this.renderAndGetWindow = this.renderer.renderAndGetWindow.bind(this.renderer);

    this._ready = this.ready().catch(this.errorHandler);
  }

  static get version() {
    return version;
  }

  ready() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this._ready) {
        return _this._ready;
      }

      // Add hooks
      if (isPlainObject(_this.options.hooks)) {
        _this.addObjectHooks(_this.options.hooks);
      } else if (typeof _this.options.hooks === 'function') {
        _this.options.hooks(_this.hook);
      }
      // Add nuxt modules
      yield _this.moduleContainer.ready();
      yield _this.renderer.ready();

      _this.initialized = true;
      yield _this.callHook('ready', _this);

      return _this;
    })();
  }

  plugin(name, fn) {
    // eslint-disable-next-line no-console
    console.error(`[warn] nuxt.plugin('${name}',..) is deprecated. Please use new hooks system.`);

    // A tiny backward compatibility util
    const hookMap = {
      'ready': 'ready',
      'close': 'close',
      'listen': 'listen',
      'built': 'build:done'
    };

    if (hookMap[name]) {
      this.hook(hookMap[name], fn);
    }

    // Always return nuxt class which has plugin() for two level hooks
    return this;
  }

  hook(name, fn) {
    if (!name || typeof fn !== 'function') {
      return;
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(fn);
  }

  callHook(name, ...args) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (!_this2._hooks[name]) {
        return;
      }
      debug(`Call ${name} hooks (${_this2._hooks[name].length})`);
      try {
        yield sequence(_this2._hooks[name], function (fn) {
          return fn(...args);
        });
      } catch (err) {
        console.error(`> Error on hook "${name}":`); // eslint-disable-line no-console
        console.error(err); // eslint-disable-line no-console
      }
    })();
  }

  addObjectHooks(hooksObj) {
    (0, _keys2.default)(hooksObj).forEach(name => {
      let hooks = hooksObj[name];
      hooks = Array.isArray(hooks) ? hooks : [hooks];

      hooks.forEach(hook => {
        this.hook(name, hook);
      });
    });
  }

  listen(port = 3000, host = 'localhost') {
    return new _promise2.default((resolve, reject) => {
      const server = this.renderer.app.listen({ port, host, exclusive: false }, err => {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }

        const _host = host === '0.0.0.0' ? 'localhost' : host;
        // eslint-disable-next-line no-console
        console.log('\n' + chalk.bgGreen.black(' OPEN ') + chalk.green(` http://${_host}:${port}\n`));

        // Close server on nuxt close
        this.hook('close', () => new _promise2.default((resolve, reject) => {
          // Destroy server by forcing every connection to be closed
          server.destroy(err => {
            debug('server closed');
            /* istanbul ignore if */
            if (err) {
              return reject(err);
            }
            resolve();
          });
        }));

        this.callHook('listen', server, { port, host }).then(resolve);
      });

      // Add server.destroy(cb) method
      enableDestroy(server);
    });
  }

  errorHandler /* istanbul ignore next */() {
    // Apply plugins
    // eslint-disable-next-line no-console
    this.callHook('error', ...arguments).catch(console.error);

    // Silent
    if (this.options.errorHandler === false) {
      return;
    }

    // Custom errorHandler
    if (typeof this.options.errorHandler === 'function') {
      return this.options.errorHandler.apply(this, arguments);
    }

    // Default handler
    // eslint-disable-next-line no-console
    console.error(...arguments);
  }

  resolvePath(path) {
    // Try to resolve using NPM resolve path first
    try {
      let resolvedPath = Module._resolveFilename(path, { paths: this.options.modulesDir });
      return resolvedPath;
    } catch (e) {}
    // Just continue

    // Shorthand to resolve from project dirs
    if (path.indexOf('@@') === 0 || path.indexOf('~~') === 0) {
      return join(this.options.rootDir, path.substr(2));
    } else if (path.indexOf('@') === 0 || path.indexOf('~') === 0) {
      return join(this.options.srcDir, path.substr(1));
    }
    return resolve(this.options.srcDir, path);
  }

  close(callback) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _this3.callHook('close', _this3);

      /* istanbul ignore if */
      if (typeof callback === 'function') {
        yield callback();
      }
    })();
  }
};