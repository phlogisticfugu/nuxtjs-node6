'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const path = require('path');
const fs = require('fs');
const { uniq } = require('lodash');
const hash = require('hash-sum');
const { chainFn, sequence } = require('../common/utils');
const Debug = require('debug');

const debug = Debug('nuxt:module');

module.exports = class ModuleContainer {
  constructor(nuxt) {
    this.nuxt = nuxt;
    this.options = nuxt.options;
    this.requiredModules = [];
  }

  ready() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _this.nuxt.callHook('modules:before', _this, _this.options.modules);
      // Load every module in sequence
      yield sequence(_this.options.modules, _this.addModule.bind(_this));
      // Call done hook
      yield _this.nuxt.callHook('modules:done', _this);
    })();
  }

  addVendor(vendor) {
    /* istanbul ignore if */
    if (!vendor) {
      return;
    }
    this.options.build.vendor = uniq(this.options.build.vendor.concat(vendor));
  }

  addTemplate(template) {
    /* istanbul ignore if */
    if (!template) {
      return;
    }
    // Validate & parse source
    const src = template.src || template;
    const srcPath = path.parse(src);
    /* istanbul ignore if */
    if (!src || typeof src !== 'string' || !fs.existsSync(src)) {
      /* istanbul ignore next */
      debug('[nuxt] invalid template', template);
      return;
    }
    // Generate unique and human readable dst filename
    const dst = template.fileName || path.basename(srcPath.dir) + '.' + srcPath.name + '.' + hash(src) + srcPath.ext;
    // Add to templates list
    const templateObj = {
      src,
      dst,
      options: template.options
    };
    this.options.build.templates.push(templateObj);
    return templateObj;
  }

  addPlugin(template) {
    const { dst } = this.addTemplate(template);
    // Add to nuxt plugins
    this.options.plugins.unshift({
      src: path.join(this.options.buildDir, dst),
      ssr: template.ssr
    });
  }

  addServerMiddleware(middleware) {
    this.options.serverMiddleware.push(middleware);
  }

  extendBuild(fn) {
    this.options.build.extend = chainFn(this.options.build.extend, fn);
  }

  extendRoutes(fn) {
    this.options.router.extendRoutes = chainFn(this.options.router.extendRoutes, fn);
  }

  requireModule(moduleOpts) {
    // Require once
    return this.addModule(moduleOpts, true);
  }

  addModule(moduleOpts, requireOnce) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      /* istanbul ignore if */
      if (!moduleOpts) {
        return;
      }

      // Allow using babel style array options
      if (Array.isArray(moduleOpts)) {
        moduleOpts = {
          src: moduleOpts[0],
          options: moduleOpts[1]
        };
      }

      // Allows passing runtime options to each module
      const options = moduleOpts.options || (typeof moduleOpts === 'object' ? moduleOpts : {});
      const src = moduleOpts.src || moduleOpts;

      // Resolve module
      let module;
      if (typeof src === 'string') {
        module = require(_this2.nuxt.resolvePath(src));
      }

      // Validate module
      /* istanbul ignore if */
      if (typeof module !== 'function') {
        throw new Error(`[nuxt] Module ${(0, _stringify2.default)(src)} should export a function`);
      }

      // Module meta
      module.meta = module.meta || {};
      let name = module.meta.name || module.name;

      // If requireOnce specified & module from NPM or with specified name
      if (requireOnce && name) {
        const alreadyRequired = _this2.requiredModules.indexOf(name) !== -1;
        if (alreadyRequired) {
          return;
        }
        _this2.requiredModules.push(name);
      }

      // Call module with `this` context and pass options
      yield new _promise2.default(function (resolve, reject) {
        const result = module.call(_this2, options, function (err) {
          /* istanbul ignore if */
          if (err) {
            return reject(err);
          }
          resolve();
        });
        // If module send back a promise
        if (result && result.then instanceof Function) {
          return result.then(resolve);
        }
        // If not expecting a callback but returns no promise (=synchronous)
        if (module.length < 2) {
          return resolve();
        }
      });
    })();
  }
};