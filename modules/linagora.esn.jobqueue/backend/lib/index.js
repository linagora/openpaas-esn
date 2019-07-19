module.exports = dependencies => {
  const moduleConfig = require('./config')(dependencies);

  moduleConfig.register();

  return require('./queue')(dependencies);
};
