'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Vue = require('vue');
var VueMeta = require('vue-meta');
var VueServerRenderer = require('vue-server-renderer');
var LRU = require('lru-cache');

module.exports = function () {
  function MetaRenderer(nuxt, renderer) {
    (0, _classCallCheck3.default)(this, MetaRenderer);

    this.nuxt = nuxt;
    this.renderer = renderer;
    this.options = nuxt.options;
    this.vueRenderer = VueServerRenderer.createRenderer();
    this.cache = LRU({});

    // Add VueMeta to Vue (this is only for SPA mode)
    // See lib/app/index.js
    Vue.use(VueMeta, {
      keyName: 'head',
      attribute: 'data-n-head',
      ssrAttribute: 'data-n-head-ssr',
      tagIDKeyName: 'hid'
    });
  }

  (0, _createClass3.default)(MetaRenderer, [{
    key: 'getMeta',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(url) {
        var vm;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                vm = new Vue({
                  render: function render(h) {
                    return h();
                  }, // Render empty html tag
                  head: this.options.head || {}
                });
                _context.next = 3;
                return this.vueRenderer.renderToString(vm);

              case 3:
                return _context.abrupt('return', vm.$meta().inject());

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getMeta(_x) {
        return _ref.apply(this, arguments);
      }

      return getMeta;
    }()
  }, {
    key: 'render',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(_ref2) {
        var _ref2$url = _ref2.url,
            url = _ref2$url === undefined ? '/' : _ref2$url;
        var meta, m, clientManifest, publicPath;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                meta = this.cache.get(url);

                if (!meta) {
                  _context2.next = 3;
                  break;
                }

                return _context2.abrupt('return', meta);

              case 3:

                meta = {
                  HTML_ATTRS: '',
                  BODY_ATTRS: '',
                  HEAD: '',
                  BODY_SCRIPTS: ''
                  // Get vue-meta context
                };_context2.next = 6;
                return this.getMeta(url);

              case 6:
                m = _context2.sent;

                // HTML_ATTRS
                meta.HTML_ATTRS = m.htmlAttrs.text();
                // BODY_ATTRS
                meta.BODY_ATTRS = m.bodyAttrs.text();
                // HEAD tags
                meta.HEAD = m.meta.text() + m.title.text() + m.link.text() + m.style.text() + m.script.text() + m.noscript.text();
                // BODY_SCRIPTS
                meta.BODY_SCRIPTS = m.script.text({ body: true }) + m.noscript.text({ body: true });
                // Resources Hints
                meta.resourceHints = '';
                // Resource Hints
                clientManifest = this.renderer.resources.clientManifest;

                if (this.options.render.resourceHints && clientManifest) {
                  publicPath = clientManifest.publicPath || '/_nuxt/';
                  // Pre-Load initial resources

                  if (Array.isArray(clientManifest.initial)) {
                    meta.resourceHints += clientManifest.initial.map(function (r) {
                      return '<link rel="preload" href="' + publicPath + r + '" as="script" />';
                    }).join('');
                  }
                  // Pre-Fetch async resources
                  if (Array.isArray(clientManifest.async)) {
                    meta.resourceHints += clientManifest.async.map(function (r) {
                      return '<link rel="prefetch" href="' + publicPath + r + '" />';
                    }).join('');
                  }
                  // Add them to HEAD
                  if (meta.resourceHints) {
                    meta.HEAD += meta.resourceHints;
                  }
                }

                // Emulate getPreloadFiles from vue-server-renderer (works for JS chunks only)
                meta.getPreloadFiles = function () {
                  return clientManifest.initial.map(function (r) {
                    return {
                      file: r,
                      fileWithoutQuery: r,
                      asType: 'script',
                      extension: 'js'
                    };
                  });
                };

                // Set meta tags inside cache
                this.cache.set(url, meta);

                return _context2.abrupt('return', meta);

              case 17:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function render(_x2) {
        return _ref3.apply(this, arguments);
      }

      return render;
    }()
  }]);
  return MetaRenderer;
}();