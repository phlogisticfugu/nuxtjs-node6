'use strict';

var _typeof2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _toConsumableArray2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('path'),
    resolve = _require.resolve,
    relative = _require.relative,
    sep = _require.sep;

var _ = require('lodash');
var PrettyError = require('pretty-error');
var Chalk = require('chalk');

exports.pe = new PrettyError();

exports.printWarn = function (msg, from) {
  /* eslint-disable no-console */
  var fromStr = from ? Chalk.yellow(' ' + from + '\n\n') : ' ';
  console.warn('\n' + Chalk.bgYellow.black(' WARN ') + fromStr + msg + '\n');
};

exports.renderError = function (_error, from) {
  var errStr = exports.pe.render(_error);
  var fromStr = from ? Chalk.red(' ' + from) : '';
  return '\n' + Chalk.bgRed.black(' ERROR ') + fromStr + '\n\n' + errStr;
};

exports.printError = function () {
  var _exports;

  /* eslint-disable no-console */
  console.error((_exports = exports).renderError.apply(_exports, arguments));
};

exports.fatalError = function () {
  var _exports2;

  /* eslint-disable no-console */
  console.error((_exports2 = exports).renderError.apply(_exports2, arguments));
  process.exit(1);
};

exports.encodeHtml = function encodeHtml(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

exports.getContext = function getContext(req, res) {
  return { req: req, res: res };
};

exports.setAnsiColors = function setAnsiColors(ansiHTML) {
  ansiHTML.setColors({
    reset: ['efefef', 'a6004c'],
    darkgrey: '5a012b',
    yellow: 'ffab07',
    green: 'aeefba',
    magenta: 'ff84bf',
    blue: '3505a0',
    cyan: '56eaec',
    red: '4e053a'
  });
};

exports.waitFor = function waitFor(ms) {
  return new _promise2.default(function (resolve) {
    return setTimeout(resolve, ms || 0);
  });
};

exports.urlJoin = function urlJoin() {
  return [].slice.call(arguments).join('/').replace(/\/+/g, '/').replace(':/', '://');
};

exports.isUrl = function isUrl(url) {
  return url.indexOf('http') === 0 || url.indexOf('//') === 0;
};

exports.promisifyRoute = function promisifyRoute(fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  // If routes is an array
  if (Array.isArray(fn)) {
    return _promise2.default.resolve(fn);
  }
  // If routes is a function expecting a callback
  if (fn.length === arguments.length) {
    return new _promise2.default(function (resolve, reject) {
      fn.apply(undefined, [function (err, routeParams) {
        if (err) {
          reject(err);
        }
        resolve(routeParams);
      }].concat(args));
    });
  }
  var promise = fn.apply(undefined, args);
  if (!promise || !(promise instanceof _promise2.default) && typeof promise.then !== 'function') {
    promise = _promise2.default.resolve(promise);
  }
  return promise;
};

exports.sequence = function sequence(tasks, fn) {
  return tasks.reduce(function (promise, task) {
    return promise.then(function () {
      return fn(task);
    });
  }, _promise2.default.resolve());
};

exports.parallel = function parallel(tasks, fn) {
  return _promise2.default.all(tasks.map(function (task) {
    return fn(task);
  }));
};

exports.chainFn = function chainFn(base, fn) {
  /* istanbul ignore if */
  if (!(fn instanceof Function)) {
    return;
  }
  return function () {
    if (typeof base !== 'function') {
      return fn.apply(this, arguments);
    }
    var baseResult = base.apply(this, arguments);
    // Allow function to mutate the first argument instead of returning the result
    if (baseResult === undefined) {
      baseResult = arguments[0];
    }
    var fnResult = fn.call.apply(fn, [this, baseResult].concat((0, _toConsumableArray3.default)(Array.prototype.slice.call(arguments, 1))));
    // Return mutated argument if no result was returned
    if (fnResult === undefined) {
      return baseResult;
    }
    return fnResult;
  };
};

exports.isPureObject = function isPureObject(o) {
  return !Array.isArray(o) && (typeof o === 'undefined' ? 'undefined' : (0, _typeof3.default)(o)) === 'object';
};

var isWindows = exports.isWindows = /^win/.test(process.platform);

var wp = exports.wp = function wp() {
  var p = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  /* istanbul ignore if */
  if (isWindows) {
    return p.replace(/\\/g, '\\\\');
  }
  return p;
};

exports.wChunk = function wChunk() {
  var p = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  /* istanbul ignore if */
  if (isWindows) {
    return p.replace(/\//g, '_');
  }
  return p;
};

var reqSep = /\//g;
var sysSep = _.escapeRegExp(sep);
var normalize = function normalize(string) {
  return string.replace(reqSep, sysSep);
};

var r = exports.r = function r() {
  var args = Array.prototype.slice.apply(arguments);
  var lastArg = _.last(args);

  if (lastArg.indexOf('@') === 0 || lastArg.indexOf('~') === 0) {
    return wp(lastArg);
  }

  return wp(resolve.apply(undefined, (0, _toConsumableArray3.default)(args.map(normalize))));
};

exports.relativeTo = function relativeTo() {
  var args = Array.prototype.slice.apply(arguments);
  var dir = args.shift();

  // Resolve path
  var path = r.apply(undefined, (0, _toConsumableArray3.default)(args));

  // Check if path is an alias
  if (path.indexOf('@') === 0 || path.indexOf('~') === 0) {
    return path;
  }

  // Make correct relative path
  var rp = relative(dir, path);
  if (rp[0] !== '.') {
    rp = './' + rp;
  }
  return wp(rp);
};

exports.flatRoutes = function flatRoutes(router) {
  var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var routes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  router.forEach(function (r) {
    if (!r.path.includes(':') && !r.path.includes('*')) {
      /* istanbul ignore if */
      if (r.children) {
        if (path === '' && r.path === '/') {
          routes.push('/');
        }
        flatRoutes(r.children, path + r.path + '/', routes);
      } else {
        path = path.replace(/^\/+$/, '/');
        routes.push((r.path === '' && path[path.length - 1] === '/' ? path.slice(0, -1) : path) + r.path);
      }
    }
  });
  return routes;
};

function cleanChildrenRoutes(routes) {
  var isChild = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var start = -1;
  var routesIndex = [];
  routes.forEach(function (route) {
    if (/-index$/.test(route.name) || route.name === 'index') {
      // Save indexOf 'index' key in name
      var res = route.name.split('-');
      var s = res.indexOf('index');
      start = start === -1 || s < start ? s : start;
      routesIndex.push(res);
    }
  });
  routes.forEach(function (route) {
    route.path = isChild ? route.path.replace('/', '') : route.path;
    if (route.path.indexOf('?') > -1) {
      var names = route.name.split('-');
      var paths = route.path.split('/');
      if (!isChild) {
        paths.shift();
      } // clean first / for parents
      routesIndex.forEach(function (r) {
        var i = r.indexOf('index') - start; //  children names
        if (i < paths.length) {
          for (var a = 0; a <= i; a++) {
            if (a === i) {
              paths[a] = paths[a].replace('?', '');
            }
            if (a < i && names[a] !== r[a]) {
              break;
            }
          }
        }
      });
      route.path = (isChild ? '' : '/') + paths.join('/');
    }
    route.name = route.name.replace(/-index$/, '');
    if (route.children) {
      if (route.children.find(function (child) {
        return child.path === '';
      })) {
        delete route.name;
      }
      route.children = cleanChildrenRoutes(route.children, true);
    }
  });
  return routes;
}

exports.createRoutes = function createRoutes(files, srcDir, pagesDir) {
  var routes = [];
  files.forEach(function (file) {
    var keys = file.replace(RegExp('^' + pagesDir), '').replace(/\.(vue|js)$/, '').replace(/\/{2,}/g, '/').split('/').slice(1);
    var route = { name: '', path: '', component: r(srcDir, file) };
    var parent = routes;
    keys.forEach(function (key, i) {
      route.name = route.name ? route.name + '-' + key.replace('_', '') : key.replace('_', '');
      route.name += key === '_' ? 'all' : '';
      route.chunkName = file.replace(/\.(vue|js)$/, '');
      var child = _.find(parent, { name: route.name });
      if (child) {
        child.children = child.children || [];
        parent = child.children;
        route.path = '';
      } else {
        if (key === 'index' && i + 1 === keys.length) {
          route.path += i > 0 ? '' : '/';
        } else {
          route.path += '/' + (key === '_' ? '*' : key.replace('_', ':'));
          if (key !== '_' && key.indexOf('_') !== -1) {
            route.path += '?';
          }
        }
      }
    });
    // Order Routes path
    parent.push(route);
    parent.sort(function (a, b) {
      if (!a.path.length) {
        return -1;
      }
      if (!b.path.length) {
        return 1;
      }
      // Order: /static, /index, /:dynamic
      // Match exact route before index: /login before /index/_slug
      if (a.path === '/') {
        return (/^\/(:|\*)/.test(b.path) ? -1 : 1
        );
      }
      if (b.path === '/') {
        return (/^\/(:|\*)/.test(a.path) ? 1 : -1
        );
      }
      var i = 0;
      var res = 0;
      var y = 0;
      var z = 0;
      var _a = a.path.split('/');
      var _b = b.path.split('/');
      for (i = 0; i < _a.length; i++) {
        if (res !== 0) {
          break;
        }
        y = _a[i] === '*' ? 2 : _a[i].indexOf(':') > -1 ? 1 : 0;
        z = _b[i] === '*' ? 2 : _b[i].indexOf(':') > -1 ? 1 : 0;
        res = y - z;
        // If a.length >= b.length
        if (i === _b.length - 1 && res === 0) {
          // change order if * found
          res = _a[i] === '*' ? -1 : 1;
        }
      }
      return res === 0 ? _a[i - 1] === '*' && _b[i] ? 1 : -1 : res;
    });
  });
  return cleanChildrenRoutes(routes);
};