'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const generateETag = require('etag');
const fresh = require('fresh');

const { getContext } = require('../../common/utils');

module.exports = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (req, res, next) {
    // Get context
    const context = getContext(req, res);

    res.statusCode = 200;
    try {
      const result = yield this.renderRoute(req.url, context);
      yield this.nuxt.callHook('render:route', req.url, result, context);
      const {
        html,
        cspScriptSrcHashes,
        error,
        redirected,
        getPreloadFiles
      } = result;

      if (redirected) {
        return html;
      }
      if (error) {
        res.statusCode = context.nuxt.error.statusCode || 500;
      }

      // Add ETag header
      if (!error && this.options.render.etag) {
        const etag = generateETag(html, this.options.render.etag);
        if (fresh(req.headers, { etag })) {
          res.statusCode = 304;
          res.end();
          return;
        }
        res.setHeader('ETag', etag);
      }

      // HTTP2 push headers for preload assets
      if (!error && this.options.render.http2.push) {
        // Parse resourceHints to extract HTTP.2 prefetch/push headers
        // https://w3c.github.io/preload/#server-push-http-2
        const pushAssets = [];
        const preloadFiles = getPreloadFiles();
        const { shouldPush } = this.options.render.http2;
        const { publicPath } = this.resources.clientManifest;

        preloadFiles.forEach(function ({ file, asType, fileWithoutQuery, extension }) {
          // By default, we only preload scripts or css
          /* istanbul ignore if */
          if (!shouldPush && asType !== 'script' && asType !== 'style') {
            return;
          }

          // User wants to explicitly control what to preload
          if (shouldPush && !shouldPush(fileWithoutQuery, asType)) {
            return;
          }

          pushAssets.push(`<${publicPath}${file}>; rel=preload; as=${asType}`);
        });

        // Pass with single Link header
        // https://blog.cloudflare.com/http-2-server-push-with-multiple-assets-per-link-header
        // https://www.w3.org/Protocols/9707-link-header.html
        res.setHeader('Link', pushAssets.join(','));
      }

      if (this.options.render.csp && this.options.render.csp.enabled) {
        const allowedSources = this.options.render.csp.allowedSources;
        const policies = this.options.render.csp.policies ? (0, _extends3.default)({}, this.options.render.csp.policies) : null;
        let cspStr = `script-src 'self' ${cspScriptSrcHashes.join(' ')}`;
        if (Array.isArray(allowedSources)) {
          // For compatible section
          cspStr = `script-src 'self' ${cspScriptSrcHashes.concat(allowedSources).join(' ')}`;
        } else if (typeof policies === 'object' && policies !== null && !Array.isArray(policies)) {
          // Set default policy if necessary
          if (!policies['script-src'] || !Array.isArray(policies['script-src'])) {
            policies['script-src'] = [`'self'`].concat(cspScriptSrcHashes);
          } else {
            policies['script-src'] = cspScriptSrcHashes.concat(policies['script-src']);
            if (!policies['script-src'].includes(`'self'`)) {
              policies['script-src'] = [`'self'`].concat(policies['script-src']);
            }
          }

          // Make content-security-policy string
          let cspArr = [];
          (0, _keys2.default)(policies).forEach(function (k) {
            cspArr.push(`${k} ${policies[k].join(' ')}`);
          });
          cspStr = cspArr.join('; ');
        }
        res.setHeader('Content-Security-Policy', cspStr);
      }

      // Send response
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(html));
      res.end(html, 'utf8');
      return html;
    } catch (err) {
      /* istanbul ignore if */
      if (context && context.redirected) {
        console.error(err); // eslint-disable-line no-console
        return err;
      }

      next(err);
    }
  });

  function nuxtMiddleware(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  }

  return nuxtMiddleware;
})();