module.exports = {
  core: require('./backend/core'),
  moduleManager: require('./backend/module-manager'),
  test: {
    helpers: require('./test/helpers'),
    moduleHelpers: require('./test/module-helpers'),
    apiHelpers: require('./test/api-helpers')
  }
};
