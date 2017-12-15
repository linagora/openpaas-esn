const data = {};

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
