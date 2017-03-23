'use strict';

const q = require('q');
const EsnConfig = require('./esn-config');

module.exports = {
  getConfigurations,
  updateConfigurations
};

function _getConfigs(moduleName, keys, domainId, userId) {
  const esnConf = new EsnConfig(moduleName, domainId);

  if (userId) {
    esnConf.setUserId(userId);
  }

  return esnConf.getMultiple(keys)
    .then(configurations => {
      const result = {
        name: moduleName,
        configurations: configurations
      };

      return result;
    });
}

function getConfigurations(modules, domainId, userId) {
  return q.all(modules.map(module => _getConfigs(module.name, module.keys, domainId, userId)));
}

function updateConfigurations(modules, domainId, userId) {
  const promiseFunctions = modules.map(module => () => {
    const esnConf = new EsnConfig(module.name, domainId);

    if (userId) {
      esnConf.setUserId(userId);
    }

    return esnConf.setMultiple(module.configurations);
  });

  // update sequentially to avoid concurrent update
  return promiseFunctions.reduce(q.when, q());
}
