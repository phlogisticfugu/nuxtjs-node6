'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const path = require('path');
const fs = require('fs');
const { uniq } = require('lodash');
const hash = require('hash-sum');
const { chainFn, sequence, printWarn } = require('../common/utils');

module.exports = class ModuleContainer {
  constructor(nuxt) {
    this.nuxt = nuxt;
    this.options = nuxt.options;
    this.requiredModules = {};
  }

  ready() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Call before hook
      yield _this.nuxt.callHook('modules:before', _this, _this.options.modules);

      // Load every module in sequence
      yield sequence(_this.options.modules, _this.addModule.bind(_this));

      // Call done hook
      yield _this.nuxt.callHook('modules:done', _this);
    })();
  }

  addVendor(vendor) {
    /* istanbul ignore if */
    if (typeof vendor !== 'string' && !Array.isArray(vendor)) {
      throw new Error('Invalid vendor: ' + vendor);
    }

    this.options.build.vendor = uniq(this.options.build.vendor.concat(vendor));
  }

  addTemplate(template) {
    /* istanbul ignore if */
    if (!template) {
      throw new Error('Invalid template:' + template);
    }

    // Validate & parse source
    const src = template.src || template;
    const srcPath = path.parse(src);
    /* istanbul ignore if */
    if (!src || typeof src !== 'string' || !fs.existsSync(src)) {
      throw new Error('Template not found:' + template);
    }

    // Generate unique and human readable dst filename
    const dst = template.fileName || path.basename(srcPath.dir) + `.${srcPath.name}.${hash(src)}` + srcPath.ext;

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
    return this.addModule(moduleOpts, true /* require once */);
  }

  addModule(moduleOpts, requireOnce) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let src;
      let options;
      let handler;

      // Type 1: String
      if (typeof moduleOpts === 'string') {
        src = moduleOpts;
      } else if (Array.isArray(moduleOpts)) {
        // Type 2: Babel style array
        src = moduleOpts[0];
        options = moduleOpts[1];
      } else if (typeof moduleOpts === 'object') {
        // Type 3: Pure object
        src = moduleOpts.src;
        options = moduleOpts.options;
        handler = moduleOpts.handler;
      }

      // Resolve handler
      if (!handler) {
        handler = require(_this2.nuxt.resolvePath(src));
      }

      // Validate handler
      /* istanbul ignore if */
      if (typeof handler !== 'function') {
        throw new Error('Module should export a function: ' + src);
      }

      // Resolve module meta
      const key = handler.meta && handler.meta.name || handler.name || src;

      // Update requiredModules
      if (typeof key === 'string') {
        if (requireOnce && _this2.requiredModules[key]) {
          return;
        }
        _this2.requiredModules[key] = { src, options, handler };
      }

      // Default module options to empty object
      if (options === undefined) {
        options = {};
      }

      return new _promise2.default(function (resolve, reject) {
        // Prepare callback
        const cb = function (err) {
          printWarn('Supporting callbacks is depricated and will be removed in next releases. Consider using async/await.', src);

          /* istanbul ignore if */
          if (err) {
            return reject(err);
          }
          resolve();
        };

        // Call module with `this` context and pass options
        const result = handler.call(_this2, options, cb);

        // If module send back a promise
        if (result && result.then) {
          return resolve(result);
        }

        // If not expecting a callback but returns no promise (=synchronous)
        if (handler.length < 2) {
          return resolve();
        }
      });
    })();
  }
};