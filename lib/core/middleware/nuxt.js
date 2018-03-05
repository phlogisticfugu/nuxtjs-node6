'use strict';

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
      yield this.nuxt.callHook('render:route', req.url, result);
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
        const allowedSources = cspScriptSrcHashes.concat(this.options.render.csp.allowedSources);

        res.setHeader('Content-Security-Policy', `script-src 'self' ${allowedSources.join(' ')}`);
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