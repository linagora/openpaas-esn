const constants = require('./constants');
const data = {core: constants.CONFIG_METADATA.core};

module.exports = {
  register,
  registerToModule,
  getAll,
  getFromModule
};

function register(moduleName, config) {
  data[moduleName] = config;
}

function registerToModule(moduleName, configName, config) {
  data[moduleName].configurations[configName] = config;
}

function getAll() {
  return data;
}

function getFromModule(moduleName) {
  return data[moduleName];
}
