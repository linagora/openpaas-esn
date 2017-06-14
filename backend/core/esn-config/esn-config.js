'use strict';

const q = require('q');
const _ = require('lodash');
const dotty = require('dotty');
const confModule = require('../configuration');
const constants = require('./constants');
const fallbackModule = require('./fallback');
const registry = require('./registry');
const pubsub = require('../pubsub').global;

const configUpdatedTopic = pubsub.topic(constants.EVENTS.CONFIG_UPDATED);

class EsnConfig {
  constructor(moduleName, domainId) {
    this.moduleName = moduleName || constants.DEFAULT_MODULE;
    this.domainId = domainId || constants.DEFAULT_DOMAIN_ID;
  }

  setModuleName(name) {
    this.moduleName = name;
  }

  setDomainId(domainId) {
    this.domainId = domainId;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getMultiple(configNames) {
    const moduleName = this.moduleName;

    return this._getModuleConfigsForDomain(moduleName)
      .then(function(moduleConfigs) {
        return configNames.map(function(configName) {
          return _.find(moduleConfigs, { name: configName });
        }).filter(Boolean);

      });
  }

  get(configName) {
    return this.getMultiple([configName]).then(function(configs) {
      const config = _.find(configs, { name: configName });

      return config && config.value;
    });
  }

  setMultiple(configsToUpdate) {
    const self = this;

    return q.ninvoke(confModule, 'findConfiguration', self.domainId, self.userId).then(configuration => {
      configuration = self._generateConfigTemplate(configuration);

      const module = _.find(configuration.modules, { name: self.moduleName });

      configsToUpdate.forEach(function(config) {
        let conf = _.find(module.configurations, { name: config.name });

        if (!conf) {
          module.configurations.push({
            name: config.name,
            value: {}
          });
          conf = _.last(module.configurations);
        }

        if (config.key) {
          dotty.put(conf.value, config.key, config.value);
        } else {
          conf.value = config.value;
        }
      });

      return q.ninvoke(confModule, 'update', configuration);
    })
    .then(data => {
      self._onConfigsUpdated(configsToUpdate);

      return data;
    });
  }

  set(config) {
    return this.setMultiple([config]);
  }

  getConfigsFromAllDomains(configName) {
    const moduleName = this.moduleName;

    return q.ninvoke(confModule, 'getAll')
      .then(function(configurations) {
        if (!configurations) {
          return [];
        }

        return configurations.map(function(configuration) {
          const configs = _extractModuleConfigs(moduleName, configuration);
          const config = _.find(configs, { name: configName });

          if (config && !_.isUndefined(config.value)) {
            return {
              domainId: configuration.domain_id,
              config: config.value
            };
          }
        }).filter(Boolean);
      });
  }

  onChange(configName, listener) {
    const { userId, domainId, moduleName } = this;

    return configUpdatedTopic.subscribe(data => {
      const updatedConfig = _.find(data.configsUpdated, { name: configName });

      if (updatedConfig &&
          data.moduleName === moduleName &&
          (!domainId || data.domainId === domainId) &&
          (!userId || data.userId === userId)) {
        listener(updatedConfig);
      }
    });
  }

  _getModuleConfigsForDomain(moduleName) {
    const self = this;

    return fallbackModule.getConfiguration(self.domainId, self.userId).then(function(configuration) {
      return _extractModuleConfigs(moduleName, configuration);
    });
  }

  _generateConfigTemplate(configuration) {
    const self = this;
    const moduleName = this.moduleName;
    const moduleTemplate = {
      name: moduleName,
      configurations: []
    };

    if (!configuration) {
      configuration = {
        domain_id: self.domainId,
        modules: [moduleTemplate]
      };

      if (self.userId) {
        configuration.user_id = self.userId;
      }
    }

    let module = _.find(configuration.modules, { name: moduleName });

    if (!module) {
      configuration.modules = configuration.modules || [];
      configuration.modules.unshift(moduleTemplate);
      module = configuration.modules[0];
    }

    return configuration;
  }

  _onConfigsUpdated(configsUpdated) {
    const { userId, domainId, moduleName } = this;
    const metadatas = registry.getAll();
    const configsToNotify = configsUpdated.filter(config =>
      metadatas[moduleName] &&
      metadatas[moduleName].configurations[config.name] &&
      metadatas[moduleName].configurations[config.name].pubsub
    );

    if (configsToNotify.length) {
      configUpdatedTopic.publish({
        userId,
        domainId,
        moduleName,
        configsUpdated: configsToNotify
      });
    }
  }
}

function _extractModuleConfigs(modulName, confObj) {
  if (confObj) {
    const module = _.find(confObj.modules, { name: modulName });

    return module && module.configurations;
  }
}

module.exports = EsnConfig;
