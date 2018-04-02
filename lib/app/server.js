'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _querystring = require('querystring');

var _lodash = require('lodash');

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _index = require('./index');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('nuxt:render');
debug.color = 4; // force blue color

const isDev = <%= isDev %>;

const noopApp = () => new _vue2.default({ render: h => h('div') });

const createNext = ssrContext => opts => {
  ssrContext.redirected = opts;
  // If nuxt generate
  if (!ssrContext.res) {
    ssrContext.nuxt.serverRendered = false;
    return;
  }
  opts.query = (0, _querystring.stringify)(opts.query);
  opts.path = opts.path + (opts.query ? '?' + opts.query : '');
  if (opts.path.indexOf('http') !== 0 && '<%= router.base %>' !== '/' && opts.path.indexOf('<%= router.base %>') !== 0) {
    opts.path = (0, _utils.urlJoin)('<%= router.base %>', opts.path);
  }
  // Avoid loop redirect
  if (opts.path === ssrContext.url) {
    ssrContext.redirected = false;
    return;
  }
  ssrContext.res.writeHead(opts.status, {
    'Location': opts.path
  });
  ssrContext.res.end();
};

// This exported function will be called by `bundleRenderer`.
// This is where we perform data-prefetching to determine the
// state of our application before actually rendering it.
// Since data fetching is async, this function is expected to
// return a Promise that resolves to the app instance.

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (ssrContext) {
    // Create ssrContext.next for simulate next() of beforeEach() when wanted to redirect
    ssrContext.redirected = false;
    ssrContext.next = createNext(ssrContext);
    // Used for beforeNuxtRender({ Components, nuxtState })
    ssrContext.beforeRenderFns = [];
    // Nuxt object (window.__NUXT__)
    ssrContext.nuxt = { layout: 'default', data: [], error: null <%= (store ? ', state: null' : '') %>, serverRendered: true
      // Create the app definition and the instance (created for each request)
    };const { app, router <%= (store ? ', store' : '') %> } = yield (0, _index.createApp)(ssrContext);
    const _app = new _vue2.default(app);

    // Add meta infos (used in renderer.js)
    ssrContext.meta = _app.$meta();
    // Keep asyncData for each matched component in ssrContext (used in app/utils.js via this.$ssrContext)
    ssrContext.asyncData = {};

    const beforeRender = (() => {
      var _ref2 = (0, _asyncToGenerator3.default)(function* () {
        // Call beforeNuxtRender() methods
        yield _promise2.default.all(ssrContext.beforeRenderFns.map(function (fn) {
          return (0, _utils.promisify)(fn, { Components, nuxtState: ssrContext.nuxt });
        }));
        <% if (store) { %>
        // Add the state from the vuex store
        ssrContext.nuxt.state = store.state;
        <% } %>
      });

      return function beforeRender() {
        return _ref2.apply(this, arguments);
      };
    })();
    const renderErrorPage = (() => {
      var _ref3 = (0, _asyncToGenerator3.default)(function* () {
        // Load layout for error page
        let errLayout = typeof _index.NuxtError.layout === 'function' ? _index.NuxtError.layout(app.context) : _index.NuxtError.layout;
        ssrContext.nuxt.layout = errLayout || 'default';
        yield _app.loadLayout(errLayout);
        _app.setLayout(errLayout);
        yield beforeRender();
        return _app;
      });

      return function renderErrorPage() {
        return _ref3.apply(this, arguments);
      };
    })();
    const render404Page = function () {
      app.context.error({ statusCode: 404, path: ssrContext.url, message: '<%= messages.error_404 %>' });
      return renderErrorPage();
    };

    <% if (isDev) { %>const s = isDev && Date.now(); <% } %>

    // Components are already resolved by setContext -> getRouteData (app/utils.js)
    const Components = (0, _utils.getMatchedComponents)(router.match(ssrContext.url));

    <% if (store) { %>
    /*
    ** Dispatch store nuxtServerInit
    */
    if (store._actions && store._actions.nuxtServerInit) {
      try {
        yield store.dispatch('nuxtServerInit', app.context);
      } catch (err) {
        debug('error occurred when calling nuxtServerInit: ', err.message);
        throw err;
      }
    }
    // ...If there is a redirect or an error, stop the process
    if (ssrContext.redirected) return noopApp();
    if (ssrContext.nuxt.error) return renderErrorPage();
    <% } %>

    /*
    ** Call global middleware (nuxt.config.js)
    */
    let midd = <%= serialize(router.middleware).replace('middleware(', 'function(') %>
    midd = midd.map(function (name) {
      if (typeof name === 'function') return name;
      if (typeof _middleware2.default[name] !== 'function') {
        app.context.error({ statusCode: 500, message: 'Unknown middleware ' + name });
      }
      return _middleware2.default[name];
    });
    yield (0, _utils.middlewareSeries)(midd, app.context);
    // ...If there is a redirect or an error, stop the process
    if (ssrContext.redirected) return noopApp();
    if (ssrContext.nuxt.error) return renderErrorPage();

    /*
    ** Set layout
    */
    let layout = Components.length ? Components[0].options.layout : _index.NuxtError.layout;
    if (typeof layout === 'function') layout = layout(app.context);
    yield _app.loadLayout(layout);
    layout = _app.setLayout(layout);
    // ...Set layout to __NUXT__
    ssrContext.nuxt.layout = _app.layoutName;

    /*
    ** Call middleware (layout + pages)
    */
    midd = [];
    if (layout.middleware) midd = midd.concat(layout.middleware);
    Components.forEach(function (Component) {
      if (Component.options.middleware) {
        midd = midd.concat(Component.options.middleware);
      }
    });
    midd = midd.map(function (name) {
      if (typeof name === 'function') return name;
      if (typeof _middleware2.default[name] !== 'function') {
        app.context.error({ statusCode: 500, message: 'Unknown middleware ' + name });
      }
      return _middleware2.default[name];
    });
    yield (0, _utils.middlewareSeries)(midd, app.context);
    // ...If there is a redirect or an error, stop the process
    if (ssrContext.redirected) return noopApp();
    if (ssrContext.nuxt.error) return renderErrorPage();

    /*
    ** Call .validate()
    */
    let isValid = true;
    Components.forEach(function (Component) {
      if (!isValid) return;
      if (typeof Component.options.validate !== 'function') return;
      isValid = Component.options.validate({
        params: app.context.route.params || {},
        query: app.context.route.query || {}
        <%= (store ? 'store' : '') %>
      });
    });
    // ...If .validate() returned false
    if (!isValid) {
      // Don't server-render the page in generate mode
      if (ssrContext._generate) ssrContext.nuxt.serverRendered = false;
      // Render a 404 error page
      return render404Page();
    }

    // If no Components found, returns 404
    if (!Components.length) return render404Page();

    // Call asyncData & fetch hooks on components matched by the route.
    let asyncDatas = yield _promise2.default.all(Components.map(function (Component) {
      let promises = [];

      // Call asyncData(context)
      if (Component.options.asyncData && typeof Component.options.asyncData === 'function') {
        let promise = (0, _utils.promisify)(Component.options.asyncData, app.context);
        promise.then(function (asyncDataResult) {
          ssrContext.asyncData[Component.cid] = asyncDataResult;
          (0, _utils.applyAsyncData)(Component);
          return asyncDataResult;
        });
        promises.push(promise);
      } else {
        promises.push(null);
      }

      // Call fetch(context)
      if (Component.options.fetch) {
        promises.push(Component.options.fetch(app.context));
      } else {
        promises.push(null);
      }

      return _promise2.default.all(promises);
    }));

    <% if (isDev) { %>if (asyncDatas.length) debug('Data fetching ' + ssrContext.url + ': ' + (Date.now() - s) + 'ms'); <% } %>

    // datas are the first row of each
    ssrContext.nuxt.data = asyncDatas.map(function (r) {
      return r[0] || {};
    });

    // ...If there is a redirect or an error, stop the process
    if (ssrContext.redirected) return noopApp();
    if (ssrContext.nuxt.error) return renderErrorPage();

    // Call beforeNuxtRender methods & add store state
    yield beforeRender();

    return _app;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();
