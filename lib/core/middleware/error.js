'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _asyncToGenerator2 = require('/Users/bradito/git/nuxtjs-node6/node_modules/babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var readSource = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(frame) {
    var sanitizeName, searchPath, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, pathDir, fullPath, source;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Remove webpack:/// & query string from the end
            sanitizeName = function sanitizeName(name) {
              return name ? name.replace('webpack:///', '').split('?')[0] : null;
            };

            frame.fileName = sanitizeName(frame.fileName);

            // Return if fileName is unknown

            if (frame.fileName) {
              _context.next = 4;
              break;
            }

            return _context.abrupt('return');

          case 4:

            // Possible paths for file
            searchPath = [this.options.srcDir, this.options.rootDir, join(this.options.buildDir, 'dist'), this.options.buildDir, process.cwd()];

            // Scan filesystem for real source

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 8;
            _iterator = (0, _getIterator3.default)(searchPath);

          case 10:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 24;
              break;
            }

            pathDir = _step.value;
            fullPath = resolve(pathDir, frame.fileName);
            _context.next = 15;
            return readFile(fullPath, 'utf-8').catch(function () {
              return null;
            });

          case 15:
            source = _context.sent;

            if (!source) {
              _context.next = 21;
              break;
            }

            frame.contents = source;
            frame.fullPath = fullPath;
            if (isAbsolute(frame.fileName)) {
              frame.fileName = relative(this.options.rootDir, fullPath);
            }
            return _context.abrupt('return');

          case 21:
            _iteratorNormalCompletion = true;
            _context.next = 10;
            break;

          case 24:
            _context.next = 30;
            break;

          case 26:
            _context.prev = 26;
            _context.t0 = _context['catch'](8);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 30:
            _context.prev = 30;
            _context.prev = 31;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 33:
            _context.prev = 33;

            if (!_didIteratorError) {
              _context.next = 36;
              break;
            }

            throw _iteratorError;

          case 36:
            return _context.finish(33);

          case 37:
            return _context.finish(30);

          case 38:

            // Fallback: use server bundle
            // TODO: restore to if after https://github.com/istanbuljs/nyc/issues/595 fixed
            /* istanbul ignore next */
            if (!frame.contents) {
              frame.contents = this.resources.serverBundle.files[frame.fileName];
            }

          case 39:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[8, 26, 30, 38], [31,, 33, 37]]);
  }));

  return function readSource(_x2) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Youch = require('@nuxtjs/youch');

var _require = require('path'),
    join = _require.join,
    resolve = _require.resolve,
    relative = _require.relative,
    isAbsolute = _require.isAbsolute;

var _require2 = require('fs-extra'),
    readFile = _require2.readFile;

module.exports = function errorMiddleware(err, req, res, next) {
  // ensure statusCode, message and name fields
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Nuxt Server Error';
  err.name = !err.name || err.name === 'Error' ? 'NuxtServerError' : err.name;

  // We hide actual errors from end users, so show them on server logs
  if (err.statusCode !== 404) {
    console.error(err); // eslint-disable-line no-console
  }

  var sendResponse = function sendResponse(content) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'text/html';

    // Set Headers
    res.statusCode = err.statusCode;
    res.statusMessage = err.name;
    res.setHeader('Content-Type', type + '; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(content));

    // Send Response
    res.end(content, 'utf-8');
  };

  // Check if request accepts JSON
  var hasReqHeader = function hasReqHeader(header, includes) {
    return req.headers[header] && req.headers[header].toLowerCase().includes(includes);
  };
  var isJson = hasReqHeader('accept', 'application/json') || hasReqHeader('user-agent', 'curl/');

  // Use basic errors when debug mode is disabled
  if (!this.options.debug) {
    // Json format is compatible with Youch json responses
    var json = {
      status: err.statusCode,
      message: err.message,
      name: err.name
    };
    if (isJson) {
      sendResponse((0, _stringify2.default)(json, undefined, 2), 'text/json');
      return;
    }
    var html = this.resources.errorTemplate(json);
    sendResponse(html);
    return;
  }

  // Show stack trace
  var youch = new Youch(err, req, readSource.bind(this), this.options.router.base, true);
  if (isJson) {
    youch.toJSON().then(function (json) {
      sendResponse((0, _stringify2.default)(json, undefined, 2), 'text/json');
    });
  } else {
    youch.toHTML().then(function (html) {
      sendResponse(html);
    });
  }
};