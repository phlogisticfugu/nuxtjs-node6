'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * Nuxt.js
 * (c) 2016-2017 Chopin Brothers
 * Core maintainer: Pooya Parsa (@pi0)
 * Released under the MIT License.
 */

var core = require('./core');
var builder = require('./builder');

module.exports = (0, _assign2.default)({}, core, builder);
