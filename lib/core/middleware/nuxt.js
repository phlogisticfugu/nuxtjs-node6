'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var generateETag = require('etag');
var fresh = require('fresh');

var _require = require('../../common/utils'),
    getContext = _require.getContext;

module.exports = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res, next) {
    var context, result, html, cspScriptSrcHashes, error, redirected, getPreloadFiles, etag, pushAssets, preloadFiles, shouldPush, publicPath, allowedSources, policies, cspStr, cspArr;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Get context
            context = getContext(req, res);


            res.statusCode = 200;
            _context.prev = 2;
            _context.next = 5;
            return this.renderRoute(req.url, context);

          case 5:
            result = _context.sent;
            _context.next = 8;
            return this.nuxt.callHook('render:route', req.url, result, context);

          case 8:
            html = result.html, cspScriptSrcHashes = result.cspScriptSrcHashes, error = result.error, redirected = result.redirected, getPreloadFiles = result.getPreloadFiles;

            if (!redirected) {
              _context.next = 11;
              break;
            }

            return _context.abrupt('return', html);

          case 11:
            if (error) {
              res.statusCode = context.nuxt.error.statusCode || 500;
            }

            // Add ETag header

            if (!(!error && this.options.render.etag)) {
              _context.next = 19;
              break;
            }

            etag = generateETag(html, this.options.render.etag);

            if (!fresh(req.headers, { etag: etag })) {
              _context.next = 18;
              break;
            }

            res.statusCode = 304;
            res.end();
            return _context.abrupt('return');

          case 18:
            res.setHeader('ETag', etag);

          case 19:

            // HTTP2 push headers for preload assets
            if (!error && this.options.render.http2.push) {
              // Parse resourceHints to extract HTTP.2 prefetch/push headers
              // https://w3c.github.io/preload/#server-push-http-2
              pushAssets = [];
              preloadFiles = getPreloadFiles();
              shouldPush = this.options.render.http2.shouldPush;
              publicPath = this.resources.clientManifest.publicPath;


              preloadFiles.forEach(function (_ref2) {
                var file = _ref2.file,
                    asType = _ref2.asType,
                    fileWithoutQuery = _ref2.fileWithoutQuery,
                    extension = _ref2.extension;

                // By default, we only preload scripts or css
                /* istanbul ignore if */
                if (!shouldPush && asType !== 'script' && asType !== 'style') {
                  return;
                }

                // User wants to explicitly control what to preload
                if (shouldPush && !shouldPush(fileWithoutQuery, asType)) {
                  return;
                }

                pushAssets.push('<' + publicPath + file + '>; rel=preload; as=' + asType);
              });

              // Pass with single Link header
              // https://blog.cloudflare.com/http-2-server-push-with-multiple-assets-per-link-header
              // https://www.w3.org/Protocols/9707-link-header.html
              res.setHeader('Link', pushAssets.join(','));
            }

            if (this.options.render.csp && this.options.render.csp.enabled) {
              allowedSources = this.options.render.csp.allowedSources;
              policies = this.options.render.csp.policies ? (0, _extends3.default)({}, this.options.render.csp.policies) : null;
              cspStr = 'script-src \'self\' ' + cspScriptSrcHashes.join(' ');

              if (Array.isArray(allowedSources)) {
                // For compatible section
                cspStr = 'script-src \'self\' ' + cspScriptSrcHashes.concat(allowedSources).join(' ');
              } else if ((typeof policies === 'undefined' ? 'undefined' : (0, _typeof3.default)(policies)) === 'object' && policies !== null && !Array.isArray(policies)) {
                // Set default policy if necessary
                if (!policies['script-src'] || !Array.isArray(policies['script-src'])) {
                  policies['script-src'] = ['\'self\''].concat(cspScriptSrcHashes);
                } else {
                  policies['script-src'] = cspScriptSrcHashes.concat(policies['script-src']);
                  if (!policies['script-src'].includes('\'self\'')) {
                    policies['script-src'] = ['\'self\''].concat(policies['script-src']);
                  }
                }

                // Make content-security-policy string
                cspArr = [];

                (0, _keys2.default)(policies).forEach(function (k) {
                  cspArr.push(k + ' ' + policies[k].join(' '));
                });
                cspStr = cspArr.join('; ');
              }
              res.setHeader('Content-Security-Policy', cspStr);
            }

            // Send response
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Length', Buffer.byteLength(html));
            res.end(html, 'utf8');
            return _context.abrupt('return', html);

          case 27:
            _context.prev = 27;
            _context.t0 = _context['catch'](2);

            if (!(context && context.redirected)) {
              _context.next = 32;
              break;
            }

            console.error(_context.t0); // eslint-disable-line no-console
            return _context.abrupt('return', _context.t0);

          case 32:

            next(_context.t0);

          case 33:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 27]]);
  }));

  function nuxtMiddleware(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  }

  return nuxtMiddleware;
}();