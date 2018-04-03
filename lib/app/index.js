'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NuxtError = exports.createApp = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

require('es6-promise/auto');

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _vueMeta = require('vue-meta');

var _vueMeta2 = _interopRequireDefault(_vueMeta);

var _router = require('./router.js');

var _noSsr = require('./components/no-ssr.js');

var _noSsr2 = _interopRequireDefault(_noSsr);

var _nuxtChild = require('./components/nuxt-child.js');

var _nuxtChild2 = _interopRequireDefault(_nuxtChild);

var _nuxtLink = require('./components/nuxt-link.js');

var _nuxtLink2 = _interopRequireDefault(_nuxtLink);

var _nuxtError = require('<%= components.ErrorPage ? components.ErrorPage : "./components/nuxt-error.vue" %>');

var _nuxtError2 = _interopRequireDefault(_nuxtError);

var _nuxt = require('./components/nuxt.js');

var _nuxt2 = _interopRequireDefault(_nuxt);

var _appPath = require('<%= appPath %>');

var _appPath2 = _interopRequireDefault(_appPath);

var _utils = require('./utils');

<% if (store) { %>
var _store = require('./store.js');
var createStore = _store.createStore;
<% } %>

/* Plugins */
<% plugins.forEach(plugin => { %>
// Source: <%= relativeToBuild(plugin.src) %><%= (plugin.ssr===false) ? ' (ssr: false)' : '' %>
var _<%= plugin.name %> = require('<%= plugin.name %>');
var <%= plugin.name %> = _interopRequireDefault(_<%= plugin.name %>);
<% }) %>

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Component: <no-ssr>
_vue2.default.component(_noSsr2.default.name, _noSsr2.default);

// Component: <nuxt-child>
_vue2.default.component(_nuxtChild2.default.name, _nuxtChild2.default);

// Component: <nuxt-link>
_vue2.default.component(_nuxtLink2.default.name, _nuxtLink2.default);

// Component: <nuxt>`
_vue2.default.component(_nuxt2.default.name, _nuxt2.default);

// vue-meta configuration
_vue2.default.use(_vueMeta2.default, {
  keyName: 'head', // the component option name that vue-meta looks for meta info on.
  attribute: 'data-n-head', // the attribute name vue-meta adds to the tags it observes
  ssrAttribute: 'data-n-head-ssr', // the attribute name that lets vue-meta know that meta info has already been server-rendered
  tagIDKeyName: 'hid' // the property name that vue-meta uses to determine whether to overwrite or append a tag
});

const defaultTransition = <%=
                          serialize(transition)
                          .replace('beforeEnter(', 'function(').replace('enter(', 'function(').replace('afterEnter(', 'function(')
                          .replace('enterCancelled(', 'function(').replace('beforeLeave(', 'function(').replace('leave(', 'function(')
                          .replace('afterLeave(', 'function(').replace('leaveCancelled(', 'function(').replace('beforeAppear(', 'function(')
                          .replace('appear(', 'function(').replace('afterAppear(', 'function(').replace('appearCancelled(', 'function(')
                          %>

(() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (ssrContext) {
    const router = (0, _router.createRouter)(ssrContext);

    <% if (store) { %>
    const store = createStore(ssrContext);
    // Add this.$router into store actions/mutations
    store.$router = router;
    <% } %>

    // Create Root instance
    // here we inject the router and store to all child components,
    // making them available everywhere as `this.$router` and `this.$store`.
    const app = (0, _extends3.default)({
      router,
      <% if (store) { %>store, <%  } %>
      nuxt: {
        defaultTransition,
        transitions: [defaultTransition],
        setTransitions(transitions) {
          if (!Array.isArray(transitions)) {
            transitions = [transitions];
          }
          transitions = transitions.map(transition => {
            if (!transition) {
              transition = defaultTransition;
            } else if (typeof transition === 'string') {
              transition = (0, _assign2.default)({}, defaultTransition, { name: transition });
            } else {
              transition = (0, _assign2.default)({}, defaultTransition, transition);
            }
            return transition;
          });
          this.$options.nuxt.transitions = transitions;
          return transitions;
        },
        err: null,
        dateErr: null,
        error(err) {
          err = err || null;
          app.context._errored = !!err;
          if (typeof err === 'string') err = { statusCode: 500, message: err };
          const nuxt = this.nuxt || this.$options.nuxt;
          nuxt.dateErr = Date.now();
          nuxt.err = err;
          // Used in lib/server.js
          if (ssrContext) ssrContext.nuxt.error = err;
          return err;
        }
      }
    }, _appPath2.default);
    <% if (store) { %>
    // Make app available into store via this.app
    store.app = app;
    <% } %>
    const next = ssrContext ? ssrContext.next : function (location) {
      return app.router.push(location);
    };
    // Resolve route
    let route;
    if (ssrContext) {
      route = router.resolve(ssrContext.url).route;
    } else {
      const path = (0, _utils.getLocation)(router.options.base);
      route = router.resolve(path).route;
    }

    // Set context to app.context
    yield (0, _utils.setContext)(app, {
      route,
      next,
      error: app.nuxt.error.bind(app),
      <% if (store) { %>store, <% } %>
      payload: ssrContext ? ssrContext.payload : undefined,
      req: ssrContext ? ssrContext.req : undefined,
      res: ssrContext ? ssrContext.res : undefined,
      beforeRenderFns: ssrContext ? ssrContext.beforeRenderFns : undefined
    });

    const inject = function (key, value) {
      if (!key) throw new Error('inject(key, value) has no key provided');
      if (!value) throw new Error('inject(key, value) has no value provided');
      key = '$' + key;
      // Add into app
      app[key] = value;
      <% if (store) { %>
      // Add into store
      store[key] = app[key];
      <% } %>
      // Check if plugin not already installed
      const installKey = '__nuxt_' + key + '_installed__';
      if (_vue2.default[installKey]) return;
      _vue2.default[installKey] = true;
      // Call Vue.use() to install the plugin into vm
      _vue2.default.use(() => {
        if (!_vue2.default.prototype.hasOwnProperty(key)) {
          (0, _defineProperty2.default)(_vue2.default.prototype, key, {
            get() {
              return this.$root.$options[key];
            }
          });
        }
      });
    };

    <% if (store) { %>
    if (process.browser) {
      // Replace store state before plugins execution
      if (window.__NUXT__ && window.__NUXT__.state) {
        store.replaceState(window.__NUXT__.state);
      }
    }
    <% } %>

    // Plugin execution
    <% plugins.filter(p => p.ssr).forEach(plugin => { %>
    if (typeof <%= plugin.name %> === 'function') {
      var _<%= plugin.name %>_asyncCall = ((context, inject) => {
        var _ref = (0, _asyncToGenerator3.default)(function* () {
          return yield <%= plugin.name %>(context, inject);
        });
        return function() {
          return _ref.apply(this, arguments)
        }
      })();
      _<%= plugin.name %>_asyncCall(app.context, inject);
    }
    <% }) %>

    <% if (plugins.filter(p => !p.ssr).length) { %>
    if (process.browser) {
      <% plugins.filter(p => !p.ssr).forEach(plugin => { %>
      if (typeof <%= plugin.name %> === 'function') {
        var _<%= plugin.name %>_asyncCall = ((context, inject) => {
          var _ref = (0, _asyncToGenerator3.default)(function* () {
            return yield <%= plugin.name %>(context, inject);
          });
          return function() {
            return _ref.apply(this, arguments)
          }
        })();
        _<%= plugin.name %>_asyncCall(app.context, inject);
      }
      <% }) %>
    }<% } %>

    // If server-side, wait for async component to be resolved first
    if (process.server && ssrContext && ssrContext.url) {
      yield new _promise2.default(function (resolve, reject) {
        router.push(ssrContext.url, resolve, function () {
          // navigated to a different route in router guard
          const unregister = router.afterEach((() => {
            var _ref2 = (0, _asyncToGenerator3.default)(function* (to, from, next) {
              ssrContext.url = to.fullPath;
              app.context.route = yield (0, _utils.getRouteData)(to);
              app.context.params = to.params || {};
              app.context.query = to.query || {};
              unregister();
              resolve();
            });

            return function (_x2, _x3, _x4) {
              return _ref2.apply(this, arguments);
            };
          })());
        });
      });
    }

    return {
      app,
      router,
      <% if(store) { %>store <%  } %>
    };
  });

  function createApp(_x) {
    return _ref.apply(this, arguments);
  }

  return createApp;
})();

exports.createApp = createApp;
exports.NuxtError = _nuxtError2.default;
