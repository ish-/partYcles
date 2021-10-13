export default {
  root: './src',

  buildOptions: {
    out: './dist',
    clean: false,
  },

  devOptions: {
    secure: true,
  },

  optimize: {
    treeshake: true,
    // bundle: true,
    minify: true,
    target: 'es2020',
  },

  workspaceRoot: '../',
  packageOptions: {
    knownEntrypoints: ['./main.js', './worker.js'],
    rollup: {
      moduleDirectories:['node_modules', '../utils/node_modules']
    },
  },
}
