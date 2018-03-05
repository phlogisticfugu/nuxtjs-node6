'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

let readSource = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (frame) {
    // Remove webpack:/// & query string from the end
    const sanitizeName = function (name) {
      return name ? name.replace('webpack:///', '').split('?')[0] : null;
    };
    frame.fileName = sanitizeName(frame.fileName);

    // Return if fileName is unknown
    if (!frame.fileName) {
      return;
    }

    // Possible paths for file
    const searchPath = [this.options.srcDir, this.options.rootDir, join(this.options.buildDir, 'dist'), this.options.buildDir, process.cwd()];

    // Scan filesystem for real source
    for (let pathDir of searchPath) {
      let fullPath = resolve(pathDir, frame.fileName);
      let source = yield readFile(fullPath, 'utf-8').catch(function () {
        return null;
      });
      if (source) {
        frame.contents = source;
        frame.fullPath = fullPath;
        if (isAbsolute(frame.fileName)) {
          frame.fileName = relative(this.options.rootDir, fullPath);
        }
        return;
      }
    }

    // Fallback: use server bundle
    // TODO: restore to if after https://github.com/istanbuljs/nyc/issues/595 fixed
    /* istanbul ignore next */
    if (!frame.contents) {
      frame.contents = this.resources.serverBundle.files[frame.fileName];
    }
  });

  return function readSource(_x) {
    return _ref.apply(this, arguments);
  };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Youch = require('@nuxtjs/youch');
const { join, resolve, relative, isAbsolute } = require('path');
const { readFile } = require('fs-extra');

module.exports = function errorMiddleware(err, req, res, next) {
  // ensure statusCode, message and name fields
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Nuxt Server Error';
  err.name = !err.name || err.name === 'Error' ? 'NuxtServerError' : err.name;

  // We hide actual errors from end users, so show them on server logs
  if (err.statusCode !== 404) {
    console.error(err); // eslint-disable-line no-console
  }

  const sendResponse = (content, type = 'text/html') => {
    // Set Headers
    res.statusCode = err.statusCode;
    res.statusMessage = err.name;
    res.setHeader('Content-Type', type + '; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(content));

    // Send Response
    res.end(content, 'utf-8');
  };

  // Check if request accepts JSON
  const hasReqHeader = (header, includes) => req.headers[header] && req.headers[header].toLowerCase().includes(includes);
  const isJson = hasReqHeader('accept', 'application/json') || hasReqHeader('user-agent', 'curl/');

  // Use basic errors when debug mode is disabled
  if (!this.options.debug) {
    // Json format is compatible with Youch json responses
    const json = {
      status: err.statusCode,
      message: err.message,
      name: err.name
    };
    if (isJson) {
      sendResponse((0, _stringify2.default)(json, undefined, 2), 'text/json');
      return;
    }
    const html = this.resources.errorTemplate(json);
    sendResponse(html);
    return;
  }

  // Show stack trace
  const youch = new Youch(err, req, readSource.bind(this), this.options.router.base, true);
  if (isJson) {
    youch.toJSON().then(json => {
      sendResponse((0, _stringify2.default)(json, undefined, 2), 'text/json');
    });
  } else {
    youch.toHTML().then(html => {
      sendResponse(html);
    });
  }
};