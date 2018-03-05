const shell = require('shelljs')

shell.rm('-rf', 'lib')
shell.mkdir('lib')
shell.cp('src/index.js', 'lib/index.js')

shell.cp('-r', 'node_modules/nuxt/lib/app', 'lib/app')
shell.exec('npx babel node_modules/nuxt/lib/builder --out-dir ./lib/builder')
shell.exec('npx babel node_modules/nuxt/lib/common --out-dir ./lib/common')
shell.exec('npx babel node_modules/nuxt/lib/core --out-dir ./lib/core')
shell.exec('npx babel node_modules/nuxt/lib/index.js --out-file ./lib/index-nuxt.js')

shell.rm('-rf', 'bin')
// TODO use babel to be safe, need to find way to remove shebang nicely
shell.cp('-r', 'node_modules/nuxt/bin', 'bin')

