'use strict';

const q = require('q');
const EsnConfig = require('./esn-config');
const registry = require('./registry');
const rights = require('./rights');
const { ROLE } = require('./constants');

module.exports = {
  getConfigurations,
  inspectConfigurations,
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

function inspectConfigurations(modules, domainId, userId) {
  let role;

  if (domainId && userId) {
    role = ROLE.user;
  } else if (domainId) {
    role = ROLE.admin;
  } else {
    role = ROLE.padmin;
  }

  modules.forEach(module => {
    const moduleMetadata = registry.getFromModule(module.name);

    module.keys = moduleMetadata ? Object.keys(moduleMetadata.configurations) : [];
  });

  return getConfigurations(modules, domainId, userId)
    .then(modulesConfigurations => {
      modulesConfigurations.forEach(module => {
        module.configurations = module.configurations.map(config => {
          if (rights.can(role, rights.READ, module.name, config.name)) {
            return Object.assign(config, {
              writable: rights.can(role, rights.WRITE, module.name, config.name)
            });
          }
        })
        .filter(Boolean);
      });

      return modulesConfigurations;
    });
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
