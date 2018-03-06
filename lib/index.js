// https://github.com/ljharb/util.promisify
require('util.promisify/shim')();
const util = require('util');

const {
  // core/index.js
  Nuxt,
  Module,
  Renderer,
  Options,
  Utils,

  // builder/index.js
  Builder,
  Generator
} = require('./index-nuxt');

module.exports = {
  Nuxt,
  Module,
  Renderer,
  Options,
  Utils,
  Builder,
  Generator
};
