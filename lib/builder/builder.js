'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { promisify } = require('util');
const _ = require('lodash');
const chokidar = require('chokidar');
const { remove, readFile, writeFile, mkdirp, existsSync } = require('fs-extra');
const hash = require('hash-sum');
const webpack = require('webpack');
const serialize = require('serialize-javascript');
const { join, resolve, basename, extname, dirname } = require('path');
const MFS = require('memory-fs');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const Debug = require('debug');
const Glob = require('glob');
const {
  r,
  wp,
  wChunk,
  createRoutes,
  sequence,
  relativeTo,
  waitFor
} = require('../common/utils');
const { Options } = require('../common');
const clientWebpackConfig = require('./webpack/client.config.js');
const serverWebpackConfig = require('./webpack/server.config.js');
const dllWebpackConfig = require('./webpack/dll.config.js');
const upath = require('upath');

const debug = Debug('nuxt:build');
debug.color = 2; // Force green color

const glob = promisify(Glob);

module.exports = class Builder {
  constructor(nuxt) {
    this.nuxt = nuxt;
    this.isStatic = false; // Flag to know if the build is for a generated app
    this.options = nuxt.options;

    // Fields that set on build
    this.compilers = [];
    this.compilersWatching = [];
    this.webpackDevMiddleware = null;
    this.webpackHotMiddleware = null;
    this.filesWatcher = null;
    this.customFilesWatcher = null;

    // Mute stats on dev
    this.webpackStats = this.options.dev ? false : this.options.build.stats;

    // Helper to resolve build paths
    this.relativeToBuild = (...args) => relativeTo(this.options.buildDir, ...args);

    this._buildStatus = STATUS.INITIAL;

    // Stop watching on nuxt.close()
    if (this.options.dev) {
      this.nuxt.hook('close', () => this.unwatch());
    }
    // else {
    // TODO: enable again when unsafe concern resolved.(common/options.js:42)
    // this.nuxt.hook('build:done', () => this.generateConfig())
    // }
  }

  get plugins() {
    return _.uniqBy(this.options.plugins.map((p, i) => {
      if (typeof p === 'string') p = { src: p };
      const pluginBaseName = basename(p.src, extname(p.src)).replace(/[^a-zA-Z?\d\s:]/g, '');
      return {
        src: this.nuxt.resolveAlias(p.src),
        ssr: p.ssr !== false,
        name: 'nuxt_plugin_' + pluginBaseName + '_' + hash(p.src)
      };
    }), p => p.name);
  }

  vendor() {
    return ['vue', 'vue-router', 'vue-meta', this.options.store && 'vuex'].concat(this.options.build.extractCSS && [
    // https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/456
    'vue-style-loader/lib/addStylesClient', 'css-loader/lib/css-base']).concat(this.options.build.vendor).filter(v => v);
  }

  vendorEntries() {
    // Used for dll
    const vendor = this.vendor();
    const vendorEntries = {};
    vendor.forEach(v => {
      try {
        require.resolve(v);
        vendorEntries[v] = [v];
      } catch (e) {
        // Ignore
      }
    });
    return vendorEntries;
  }

  forGenerate() {
    this.isStatic = true;
  }

  build() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Avoid calling build() method multiple times when dev:true
      /* istanbul ignore if */
      if (_this._buildStatus === STATUS.BUILD_DONE && _this.options.dev) {
        return _this;
      }
      // If building
      /* istanbul ignore if */
      if (_this._buildStatus === STATUS.BUILDING) {
        yield waitFor(1000);
        return _this.build();
      }
      _this._buildStatus = STATUS.BUILDING;

      // Wait for nuxt ready
      yield _this.nuxt.ready();

      // Call before hook
      yield _this.nuxt.callHook('build:before', _this, _this.options.build);

      // Check if pages dir exists and warn if not
      _this._nuxtPages = typeof _this.options.build.createRoutes !== 'function';
      if (_this._nuxtPages) {
        if (!existsSync(join(_this.options.srcDir, _this.options.dir.pages))) {
          let dir = _this.options.srcDir;
          if (existsSync(join(_this.options.srcDir, '..', _this.options.dir.pages))) {
            throw new Error(`No \`${_this.options.dir.pages}\` directory found in ${dir}. Did you mean to run \`nuxt\` in the parent (\`../\`) directory?`);
          } else {
            throw new Error(`Couldn't find a \`${_this.options.dir.pages}\` directory in ${dir}. Please create one under the project root`);
          }
        }
      }

      debug(`App root: ${_this.options.srcDir}`);
      debug(`Generating ${_this.options.buildDir} files...`);

      // Create .nuxt/, .nuxt/components and .nuxt/dist folders
      yield remove(r(_this.options.buildDir));
      yield mkdirp(r(_this.options.buildDir, 'components'));
      if (!_this.options.dev) {
        yield mkdirp(r(_this.options.buildDir, 'dist'));
      }

      // Generate routes and interpret the template files
      yield _this.generateRoutesAndFiles();

      // Start webpack build
      yield _this.webpackBuild();

      // Flag to set that building is done
      _this._buildStatus = STATUS.BUILD_DONE;

      // Call done hook
      yield _this.nuxt.callHook('build:done', _this);

      return _this;
    })();
  }

  getBabelOptions({ isServer }) {
    const options = _.defaults({}, {
      babelrc: false,
      cacheDirectory: !!this.options.dev
    }, this.options.build.babel);

    if (typeof options.presets === 'function') {
      options.presets = options.presets({ isServer });
    }

    if (!options.babelrc && !options.presets) {
      options.presets = [[require.resolve('babel-preset-vue-app'), {
        targets: isServer ? { node: '8.0.0' } : { ie: 9, uglify: true }
      }]];
    }

    return options;
  }

  getFileName(name) {
    let fileName = this.options.build.filenames[name];

    // Don't use hashes when watching
    // https://github.com/webpack/webpack/issues/1914#issuecomment-174171709
    if (this.options.dev) {
      fileName = fileName.replace(/\[(chunkhash|contenthash|hash)\]\./g, '');
    }

    return fileName;
  }

  generateRoutesAndFiles() {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      debug('Generating files...');
      // -- Templates --
      let templatesFiles = ['App.js', 'client.js', 'index.js', 'middleware.js', 'router.js', 'server.js', 'utils.js', 'empty.js', 'components/nuxt-error.vue', 'components/nuxt-loading.vue', 'components/nuxt-child.js', 'components/nuxt-link.js', 'components/nuxt.js', 'components/no-ssr.js', 'views/app.template.html', 'views/error.html'];
      const templateVars = {
        options: _this2.options,
        extensions: _this2.options.extensions.map(function (ext) {
          return ext.replace(/^\./, '');
        }).join('|'),
        messages: _this2.options.messages,
        uniqBy: _.uniqBy,
        isDev: _this2.options.dev,
        debug: _this2.options.debug,
        mode: _this2.options.mode,
        router: _this2.options.router,
        env: _this2.options.env,
        head: _this2.options.head,
        middleware: existsSync(join(_this2.options.srcDir, _this2.options.dir.middleware)),
        store: _this2.options.store,
        css: _this2.options.css,
        plugins: _this2.plugins,
        appPath: './App.js',
        ignorePrefix: _this2.options.ignorePrefix,
        layouts: (0, _assign2.default)({}, _this2.options.layouts),
        loading: typeof _this2.options.loading === 'string' ? _this2.relativeToBuild(_this2.options.srcDir, _this2.options.loading) : _this2.options.loading,
        transition: _this2.options.transition,
        layoutTransition: _this2.options.layoutTransition,
        dir: _this2.options.dir,
        components: {
          ErrorPage: _this2.options.ErrorPage ? _this2.relativeToBuild(_this2.options.ErrorPage) : null
        }

        // -- Layouts --
      };if (existsSync(resolve(_this2.options.srcDir, _this2.options.dir.layouts))) {
        const layoutsFiles = yield glob(`${_this2.options.dir.layouts}/**/*.{vue,js}`, {
          cwd: _this2.options.srcDir,
          ignore: _this2.options.ignore
        });
        let hasErrorLayout = false;
        layoutsFiles.forEach(function (file) {
          let name = file.split('/').slice(1).join('/').replace(/\.(vue|js)$/, '');
          if (name === 'error') {
            hasErrorLayout = true;
            return;
          }
          if (!templateVars.layouts[name] || /\.vue$/.test(file)) {
            templateVars.layouts[name] = _this2.relativeToBuild(_this2.options.srcDir, file);
          }
        });
        if (!templateVars.components.ErrorPage && hasErrorLayout) {
          templateVars.components.ErrorPage = _this2.relativeToBuild(_this2.options.srcDir, `${_this2.options.dir.layouts}/error.vue`);
        }
      }
      // If no default layout, create its folder and add the default folder
      if (!templateVars.layouts.default) {
        yield mkdirp(r(_this2.options.buildDir, 'layouts'));
        templatesFiles.push('layouts/default.vue');
        templateVars.layouts.default = './layouts/default.vue';
      }

      // -- Routes --
      debug('Generating routes...');
      // If user defined a custom method to create routes
      if (_this2._nuxtPages) {
        // Use nuxt.js createRoutes bases on pages/
        const files = {};(yield glob(`${_this2.options.dir.pages}/**/*.{vue,js}`, {
          cwd: _this2.options.srcDir,
          ignore: _this2.options.ignore
        })).forEach(function (f) {
          const key = f.replace(/\.(js|vue)$/, '');
          if (/\.vue$/.test(f) || !files[key]) {
            files[key] = f;
          }
        });
        templateVars.router.routes = createRoutes((0, _values2.default)(files), _this2.options.srcDir, _this2.options.dir.pages);
      } else {
        templateVars.router.routes = _this2.options.build.createRoutes(_this2.options.srcDir);
      }

      yield _this2.nuxt.callHook('build:extendRoutes', templateVars.router.routes, r);

      // router.extendRoutes method
      if (typeof _this2.options.router.extendRoutes === 'function') {
        // let the user extend the routes
        const extendedRoutes = _this2.options.router.extendRoutes(templateVars.router.routes, r);
        // Only overwrite routes when something is returned for backwards compatibility
        if (extendedRoutes !== undefined) {
          templateVars.router.routes = extendedRoutes;
        }
      }

      // Make routes accessible for other modules and webpack configs
      _this2.routes = templateVars.router.routes;

      // -- Store --
      // Add store if needed
      if (_this2.options.store) {
        templatesFiles.push('store.js');
      }

      // Resolve template files
      const customTemplateFiles = _this2.options.build.templates.map(function (t) {
        return t.dst || basename(t.src || t);
      });

      templatesFiles = templatesFiles.map(function (file) {
        // Skip if custom file was already provided in build.templates[]
        if (customTemplateFiles.indexOf(file) !== -1) {
          return;
        }
        // Allow override templates using a file with same name in ${srcDir}/app
        const customPath = r(_this2.options.srcDir, 'app', file);
        const customFileExists = existsSync(customPath);

        return {
          src: customFileExists ? customPath : r(_this2.options.nuxtAppDir, file),
          dst: file,
          custom: customFileExists
        };
      }).filter(function (i) {
        return !!i;
      });

      // -- Custom templates --
      // Add custom template files
      templatesFiles = templatesFiles.concat(_this2.options.build.templates.map(function (t) {
        return (0, _assign2.default)({
          src: r(_this2.options.srcDir, t.src || t),
          dst: t.dst || basename(t.src || t),
          custom: true
        }, t);
      }));

      // -- Loading indicator --
      if (_this2.options.loadingIndicator.name) {
        const indicatorPath1 = resolve(_this2.options.nuxtAppDir, 'views/loading', _this2.options.loadingIndicator.name + '.html');
        const indicatorPath2 = _this2.nuxt.resolveAlias(_this2.options.loadingIndicator.name);
        const indicatorPath = existsSync(indicatorPath1) ? indicatorPath1 : existsSync(indicatorPath2) ? indicatorPath2 : null;
        if (indicatorPath) {
          templatesFiles.push({
            src: indicatorPath,
            dst: 'loading.html',
            options: _this2.options.loadingIndicator
          });
        } else {
          /* istanbul ignore next */
          // eslint-disable-next-line no-console
          console.error(`Could not fetch loading indicator: ${_this2.options.loadingIndicator.name}`);
        }
      }

      yield _this2.nuxt.callHook('build:templates', {
        templatesFiles,
        templateVars,
        resolve: r
      });

      // Interpret and move template files to .nuxt/
      yield _promise2.default.all(templatesFiles.map((() => {
        var _ref = (0, _asyncToGenerator3.default)(function* ({ src, dst, options, custom }) {
          // Add template to watchers
          _this2.options.build.watch.push(src);
          // Render template to dst
          const fileContent = yield readFile(src, 'utf8');
          let content;
          try {
            const template = _.template(fileContent, {
              imports: {
                serialize,
                hash,
                r,
                wp,
                wChunk,
                resolvePath: _this2.nuxt.resolvePath.bind(_this2.nuxt),
                resolveAlias: _this2.nuxt.resolveAlias.bind(_this2.nuxt),
                relativeToBuild: _this2.relativeToBuild
              }
            });
            content = template((0, _assign2.default)({}, templateVars, {
              options: options || {},
              custom,
              src,
              dst
            }));
          } catch (err) {
            /* istanbul ignore next */
            throw new Error(`Could not compile template ${src}: ${err.message}`);
          }
          const path = r(_this2.options.buildDir, dst);
          // Ensure parent dir exits
          yield mkdirp(dirname(path));
          // Write file
          yield writeFile(path, content, 'utf8');
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      })()));
    })();
  }

  webpackBuild() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      debug('Building files...');
      const compilersOptions = [];

      // Client
      const clientConfig = clientWebpackConfig.call(_this3);
      compilersOptions.push(clientConfig);

      // Server
      let serverConfig = null;
      if (_this3.options.build.ssr) {
        serverConfig = serverWebpackConfig.call(_this3);
        compilersOptions.push(serverConfig);
      }

      // Alias plugins to their real path
      _this3.plugins.forEach(function (p) {
        const src = _this3.relativeToBuild(p.src);

        // Client config
        if (!clientConfig.resolve.alias[p.name]) {
          clientConfig.resolve.alias[p.name] = src;
        }

        // Server config
        if (serverConfig && !serverConfig.resolve.alias[p.name]) {
          // Alias to noop for ssr:false plugins
          serverConfig.resolve.alias[p.name] = p.ssr ? src : './empty.js';
        }
      });

      // Make a dll plugin after compile to make nuxt dev builds faster
      if (_this3.options.build.dll && _this3.options.dev) {
        compilersOptions.push(dllWebpackConfig.call(_this3, clientConfig));
      }

      // Initialize shared FS and Cache
      const sharedFS = _this3.options.dev && new MFS();
      const sharedCache = {};

      // Initialize compilers
      _this3.compilers = compilersOptions.map(function (compilersOption) {
        const compiler = webpack(compilersOption);
        // In dev, write files in memory FS (except for DLL)
        if (sharedFS && !compiler.name.includes('-dll')) {
          compiler.outputFileSystem = sharedFS;
        }
        compiler.cache = sharedCache;
        return compiler;
      });

      // Start Builds
      yield sequence(_this3.compilers, function (compiler) {
        return new _promise2.default((() => {
          var _ref2 = (0, _asyncToGenerator3.default)(function* (resolve, reject) {
            const name = compiler.options.name;
            yield _this3.nuxt.callHook('build:compile', { name, compiler });

            // Resolve only when compiler emit done event
            compiler.plugin('done', (() => {
              var _ref3 = (0, _asyncToGenerator3.default)(function* (stats) {
                yield _this3.nuxt.callHook('build:compiled', {
                  name,
                  compiler,
                  stats
                });
                // Reload renderer if available
                _this3.nuxt.renderer.loadResources(sharedFS || require('fs'));
                // Resolve on next tick
                process.nextTick(resolve);
              });

              return function (_x4) {
                return _ref3.apply(this, arguments);
              };
            })());
            // --- Dev Build ---
            if (_this3.options.dev) {
              // Client Build, watch is started by dev-middleware
              if (compiler.options.name === 'client') {
                return _this3.webpackDev(compiler);
              }
              // DLL build, should run only once
              if (compiler.options.name.includes('-dll')) {
                compiler.run(function (err, stats) {
                  if (err) return reject(err);
                  debug('[DLL] updated');
                });
                return;
              }
              // Server, build and watch for changes
              _this3.compilersWatching.push(compiler.watch(_this3.options.watchers.webpack, function (err) {
                /* istanbul ignore if */
                if (err) return reject(err);
              }));
              return;
            }
            // --- Production Build ---
            compiler.run(function (err, stats) {
              /* istanbul ignore if */
              if (err) {
                console.error(err); // eslint-disable-line no-console
                return reject(err);
              }

              // Show build stats for production
              console.log(stats.toString(_this3.webpackStats)); // eslint-disable-line no-console

              /* istanbul ignore if */
              if (stats.hasErrors()) {
                return reject(new Error('Webpack build exited with errors'));
              }
            });
          });

          return function (_x2, _x3) {
            return _ref2.apply(this, arguments);
          };
        })());
      });
    })();
  }

  webpackDev(compiler) {
    debug('Adding webpack middleware...');

    // Create webpack dev middleware
    this.webpackDevMiddleware = promisify(webpackDevMiddleware(compiler, (0, _assign2.default)({
      publicPath: this.options.build.publicPath,
      stats: this.webpackStats,
      logLevel: 'silent',
      watchOptions: this.options.watchers.webpack
    }, this.options.build.devMiddleware)));

    this.webpackDevMiddleware.close = promisify(this.webpackDevMiddleware.close);

    this.webpackHotMiddleware = promisify(webpackHotMiddleware(compiler, (0, _assign2.default)({
      log: false,
      heartbeat: 10000
    }, this.options.build.hotMiddleware)));

    // Inject to renderer instance
    if (this.nuxt.renderer) {
      this.nuxt.renderer.webpackDevMiddleware = this.webpackDevMiddleware;
      this.nuxt.renderer.webpackHotMiddleware = this.webpackHotMiddleware;
    }

    // Start watching files
    this.watchFiles();
  }

  watchFiles() {
    const src = this.options.srcDir;
    let patterns = [r(src, this.options.dir.layouts), r(src, this.options.dir.store), r(src, this.options.dir.middleware), r(src, `${this.options.dir.layouts}/*.{vue,js}`), r(src, `${this.options.dir.layouts}/**/*.{vue,js}`)];
    if (this._nuxtPages) {
      patterns.push(r(src, this.options.dir.pages), r(src, `${this.options.dir.pages}/*.{vue,js}`), r(src, `${this.options.dir.pages}/**/*.{vue,js}`));
    }
    patterns = _.map(patterns, p => upath.normalizeSafe(p));

    const options = (0, _assign2.default)({}, this.options.watchers.chokidar, {
      ignoreInitial: true
    });
    /* istanbul ignore next */
    const refreshFiles = _.debounce(() => this.generateRoutesAndFiles(), 200);

    // Watch for src Files
    this.filesWatcher = chokidar.watch(patterns, options).on('add', refreshFiles).on('unlink', refreshFiles);

    // Watch for custom provided files
    let customPatterns = _.concat(this.options.build.watch, ..._.values(_.omit(this.options.build.styleResources, ['options'])));
    customPatterns = _.map(_.uniq(customPatterns), p => upath.normalizeSafe(p));
    this.customFilesWatcher = chokidar.watch(customPatterns, options).on('change', refreshFiles);
  }

  unwatch() {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this4.filesWatcher) {
        _this4.filesWatcher.close();
      }

      if (_this4.customFilesWatcher) {
        _this4.customFilesWatcher.close();
      }

      _this4.compilersWatching.forEach(function (watching) {
        return watching.close();
      });

      // Stop webpack middleware
      yield _this4.webpackDevMiddleware.close();
    })();
  }

  // TODO: remove ignore when generateConfig enabled again
  generateConfig() /* istanbul ignore next */{
    var _this5 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const config = resolve(_this5.options.buildDir, 'build.config.js');
      const options = _.omit(_this5.options, Options.unsafeKeys);
      yield writeFile(config, `module.exports = ${(0, _stringify2.default)(options, null, '  ')}`, 'utf8');
    })();
  }
};

const STATUS = {
  INITIAL: 1,
  BUILD_DONE: 2,
  BUILDING: 3
};