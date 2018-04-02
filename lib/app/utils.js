'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setContext = exports.getRouteData = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

let getRouteData = exports.getRouteData = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (route) {
    // Make sure the components are resolved (code-splitting)
    yield resolveRouteComponents(route);
    // Send back a copy of route with meta based on Component definition
    return (0, _extends3.default)({}, route, {
      meta: getMatchedComponents(route).map(function (Component) {
        return Component.options.meta || {};
      })
    });
  });

  return function getRouteData(_x5) {
    return _ref2.apply(this, arguments);
  };
})();

let setContext = exports.setContext = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* (app, context) {
    const route = context.to ? context.to : context.route;
    // If context not defined, create it
    if (!app.context) {
      app.context = {
        get isServer() {
          console.warn('context.isServer has been deprecated, please use process.server instead.');
          return process.server;
        },
        get isClient() {
          console.warn('context.isClient has been deprecated, please use process.client instead.');
          return process.client;
        },
        isStatic: process.static,
        isDev: <%= isDev %>,
        isHMR: false,
        app,
        <%= (store ? 'store: app.store,' : '') %>
        payload: context.payload,
        error: context.error,
        base: '<%= router.base %>',
        env: <%= JSON.stringify(env) %>
        // Only set once
      };if (context.req) app.context.req = context.req;
      if (context.res) app.context.res = context.res;
      app.context.redirect = function (status, path, query) {
        if (!status) return;
        app.context._redirected = true; // Used in middleware
        // if only 1 or 2 arguments: redirect('/') or redirect('/', { foo: 'bar' })
        let pathType = typeof path;
        if (typeof status !== 'number' && (pathType === 'undefined' || pathType === 'object')) {
          query = path || {};
          path = status;
          pathType = typeof path;
          status = 302;
        }
        if (pathType === 'object') {
          path = app.router.resolve(path).href;
        }
        // "/absolute/route", "./relative/route" or "../relative/route"
        if (/(^[.]{1,2}\/)|(^\/(?!\/))/.test(path)) {
          app.context.next({
            path: path,
            query: query,
            status: status
          });
        } else {
          path = formatUrl(path, query);
          if (process.server) {
            app.context.next({
              path: path,
              status: status
            });
          }
          if (process.client) {
            // https://developer.mozilla.org/en-US/docs/Web/API/Location/replace
            window.location.replace(path);

            // Throw a redirect error
            throw new Error('ERR_REDIRECT');
          }
        }
      };
      if (process.server) app.context.beforeNuxtRender = function (fn) {
        return context.beforeRenderFns.push(fn);
      };
      if (process.client) app.context.nuxtState = window.__NUXT__;
    }
    // Dynamic keys
    app.context.next = context.next;
    app.context._redirected = false;
    app.context._errored = false;
    app.context.isHMR = !!context.isHMR;
    if (context.route) app.context.route = yield getRouteData(context.route);
    app.context.params = app.context.route.params || {};
    app.context.query = app.context.route.query || {};
    if (context.from) app.context.from = yield getRouteData(context.from);
  });

  return function setContext(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
})();

exports.applyAsyncData = applyAsyncData;
exports.sanitizeComponent = sanitizeComponent;
exports.getMatchedComponents = getMatchedComponents;
exports.getMatchedComponentsInstances = getMatchedComponentsInstances;
exports.flatMapComponents = flatMapComponents;
exports.resolveRouteComponents = resolveRouteComponents;
exports.middlewareSeries = middlewareSeries;
exports.promisify = promisify;
exports.getLocation = getLocation;
exports.urlJoin = urlJoin;
exports.compile = compile;
exports.getQueryDiff = getQueryDiff;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const noopData = () => ({});

// window.onNuxtReady(() => console.log('Ready')) hook
// Useful for jsdom testing or plugins (https://github.com/tmpvar/jsdom#dealing-with-asynchronous-script-loading)
if (process.browser) {
  window._nuxtReadyCbs = [];
  window.onNuxtReady = function (cb) {
    window._nuxtReadyCbs.push(cb);
  };
}

function applyAsyncData(Component, asyncData) {
  const ComponentData = Component.options.data || noopData;
  // Prevent calling this method for each request on SSR context
  if (!asyncData && Component.options.hasAsyncData) {
    return;
  }
  Component.options.hasAsyncData = true;
  Component.options.data = function () {
    const data = ComponentData.call(this);
    if (this.$ssrContext) {
      asyncData = this.$ssrContext.asyncData[Component.cid];
    }
    return (0, _extends3.default)({}, data, asyncData);
  };
  if (Component._Ctor && Component._Ctor.options) {
    Component._Ctor.options.data = Component.options.data;
  }
}

function sanitizeComponent(Component) {
  // If Component already sanitized
  if (Component.options && Component._Ctor === Component) {
    return Component;
  }
  if (!Component.options) {
    Component = _vue2.default.extend(Component); // fix issue #6
    Component._Ctor = Component;
  } else {
    Component._Ctor = Component;
    Component.extendOptions = Component.options;
  }
  // For debugging purpose
  if (!Component.options.name && Component.options.__file) {
    Component.options.name = Component.options.__file;
  }
  return Component;
}

function getMatchedComponents(route, matches = false) {
  return [].concat.apply([], route.matched.map(function (m, index) {
    return (0, _keys2.default)(m.components).map(function (key) {
      matches && matches.push(index);
      return m.components[key];
    });
  }));
}

function getMatchedComponentsInstances(route, matches = false) {
  return [].concat.apply([], route.matched.map(function (m, index) {
    return (0, _keys2.default)(m.instances).map(function (key) {
      matches && matches.push(index);
      return m.instances[key];
    });
  }));
}

function flatMapComponents(route, fn) {
  return Array.prototype.concat.apply([], route.matched.map(function (m, index) {
    return (0, _keys2.default)(m.components).map(function (key) {
      return fn(m.components[key], m.instances[key], m, key, index);
    });
  }));
}

function resolveRouteComponents(route) {
  return _promise2.default.all(flatMapComponents(route, (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (Component, _, match, key) {
      // If component is a function, resolve it
      if (typeof Component === 'function' && !Component.options) {
        Component = yield Component();
      }
      return match.components[key] = sanitizeComponent(Component);
    });

    return function (_x, _x2, _x3, _x4) {
      return _ref.apply(this, arguments);
    };
  })()));
}

function middlewareSeries(promises, appContext) {
  if (!promises.length || appContext._redirected || appContext._errored) {
    return _promise2.default.resolve();
  }
  return promisify(promises[0], appContext).then(() => {
    return middlewareSeries(promises.slice(1), appContext);
  });
}

function promisify(fn, context) {
  let promise;
  if (fn.length === 2) {
    // fn(context, callback)
    promise = new _promise2.default(resolve => {
      fn(context, function (err, data) {
        if (err) {
          context.error(err);
        }
        data = data || {};
        resolve(data);
      });
    });
  } else {
    promise = fn(context);
  }
  if (!promise || !(promise instanceof _promise2.default) && typeof promise.then !== 'function') {
    promise = _promise2.default.resolve(promise);
  }
  return promise;
}

// Imported from vue-router
function getLocation(base, mode) {
  var path = window.location.pathname;
  if (mode === 'hash') {
    return window.location.hash.replace(/^#\//, '');
  }
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length);
  }
  return (path || '/') + window.location.search + window.location.hash;
}

function urlJoin() {
  return [].slice.call(arguments).join('/').replace(/\/+/g, '/');
}

// Imported from path-to-regexp

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile(str, options) {
  return tokensToFunction(parse(str, options));
}

function getQueryDiff(toQuery, fromQuery) {
  const diff = {};
  const queries = (0, _extends3.default)({}, toQuery, fromQuery);
  for (const k in queries) {
    if (String(toQuery[k]) !== String(fromQuery[k])) {
      diff[k] = true;
    }
  }
  return diff;
}

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
const PATH_REGEXP = new RegExp([
// Match escaped characters that would otherwise appear in future matches.
// This allows the user to escape special characters that won't transform.
'(\\\\.)',
// Match Express-style parameters and un-named parameters with a prefix
// and optional suffixes. Matches appear as:
//
// "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
// "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
// "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
'([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse(str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = options && options.delimiter || '/';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue;
    }

    var next = str[index];
    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var modifier = res[6];
    var asterisk = res[7];

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var partial = prefix != null && next != null && next !== prefix;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = res[2] || defaultDelimiter;
    var pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: pattern ? escapeGroup(pattern) : asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?'
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens;
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty(str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk(str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }

  return function (obj, opts) {
    var path = '';
    var data = obj || {};
    var options = opts || {};
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue;
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix;
          }

          continue;
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined');
        }
      }

      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + (0, _stringify2.default)(value) + '`');
        }

        if (value.length === 0) {
          if (token.optional) {
            continue;
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty');
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + (0, _stringify2.default)(segment) + '`');
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue;
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"');
      }

      path += token.prefix + segment;
    }

    return path;
  };
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1');
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup(group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Format given url, append query to url query string
 *
 * @param  {string} url
 * @param  {string} query
 * @return {string}
 */
function formatUrl(url, query) {
  let protocol;
  let index = url.indexOf('://');
  if (index !== -1) {
    protocol = url.substring(0, index);
    url = url.substring(index + 3);
  } else if (url.indexOf('//') === 0) {
    url = url.substring(2);
  }

  let parts = url.split('/');
  let result = (protocol ? protocol + '://' : '//') + parts.shift();

  let path = parts.filter(Boolean).join('/');
  let hash;
  parts = path.split('#');
  if (parts.length === 2) {
    path = parts[0];
    hash = parts[1];
  }

  result += path ? '/' + path : '';

  if (query && (0, _stringify2.default)(query) !== '{}') {
    result += (url.split('?').length === 2 ? '&' : '?') + formatQuery(query);
  }
  result += hash ? '#' + hash : '';

  return result;
}

/**
 * Transform data object to query string
 *
 * @param  {object} query
 * @return {string}
 */
function formatQuery(query) {
  return (0, _keys2.default)(query).sort().map(key => {
    var val = query[key];
    if (val == null) {
      return '';
    }
    if (Array.isArray(val)) {
      return val.slice().map(val2 => [key, '=', val2].join('')).join('&');
    }
    return key + '=' + val;
  }).filter(Boolean).join('&');
}
