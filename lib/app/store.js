'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStore = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _vuex = require('vuex');

var _vuex2 = _interopRequireDefault(_vuex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_vue2.default.use(_vuex2.default);

// Recursive find files in {srcDir}/{dir.store}
const files = require.context('@/<%= dir.store %>', true, /^\.\/(?! <%= ignorePrefix %> )[^.]+\.(<%= extensions %>)$/);
const filenames = files.keys();

// Store
let storeData = {};

// Check if {dir.store}/index.js exists
let indexFilename;
filenames.forEach(filename => {
  if (filename.indexOf('./index.') !== -1) {
    indexFilename = filename;
  }
});
if (indexFilename) {
  storeData = getModule(indexFilename);
}

// If store is not an exported method = modules store
if (typeof storeData !== 'function') {

  // Store modules
  if (!storeData.modules) {
    storeData.modules = {};
  }

  for (let filename of filenames) {
    let name = filename.replace(/^\.\//, '').replace(/\.(<%= extensions %>)$/, '');
    if (name === 'index') continue;

    let namePath = name.split(/\//);
    let module = getModuleNamespace(storeData, namePath);

    name = namePath.pop();
    module[name] = getModule(filename);
    module[name].namespaced = true;
  }
}

// createStore
const createStore = exports.createStore = storeData instanceof Function ? storeData : () => {
  return new _vuex2.default.Store((0, _assign2.default)({
    strict: process.env.NODE_ENV !== 'production'
  }, storeData, {
    state: storeData.state instanceof Function ? storeData.state() : {}
  }));
};

// Dynamically require module
function getModule(filename) {
  const file = files(filename);
  const module = file.default || file;
  if (module.commit) {
    throw new Error('[nuxt] <%= dir.store %>/' + filename.replace('./', '') + ' should export a method which returns a Vuex instance.');
  }
  if (module.state && typeof module.state !== 'function') {
    throw new Error('[nuxt] state should be a function in <%= dir.store %>/' + filename.replace('./', ''));
  }
  return module;
}

function getModuleNamespace(storeData, namePath) {
  if (namePath.length === 1) {
    return storeData.modules;
  }
  let namespace = namePath.shift();
  storeData.modules[namespace] = storeData.modules[namespace] || {};
  storeData.modules[namespace].namespaced = true;
  storeData.modules[namespace].modules = storeData.modules[namespace].modules || {};
  return getModuleNamespace(storeData.modules[namespace], namePath);
}
