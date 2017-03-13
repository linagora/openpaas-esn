'use strict';

const q = require('q');
const _ = require('lodash');
const dotty = require('dotty');
const confModule = require('../configuration');
const constants = require('./constants');
const fallbackModule = require('./fallback');

function EsnConfig(moduleName, domainId) {
  this.moduleName = moduleName || constants.DEFAULT_MODULE;
  this.domainId = domainId || constants.DEFAULT_DOMAIN_ID;
}

EsnConfig.prototype.setModuleName = function(name) {
  this.moduleName = name;
};

EsnConfig.prototype.setDomainId = function(domainId) {
  this.domainId = domainId;
};

EsnConfig.prototype.setUserId = function(userId) {
  this.userId = userId;
};

EsnConfig.prototype.getMultiple = function(configNames) {
  const moduleName = this.moduleName;

  return this._getModuleConfigsForDomain(moduleName)
    .then(function(moduleConfigs) {
      return configNames.map(function(configName) {
        return _.find(moduleConfigs, { name: configName });
      }).filter(Boolean);

    });
};

EsnConfig.prototype.get = function(configName) {
  return this.getMultiple([configName]).then(function(configs) {
    var config = _.find(configs, { name: configName });

    return config && config.value;
  });
};

EsnConfig.prototype.setMultiple = function(configsToUpdate) {
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
  });
};

EsnConfig.prototype.set = function(config) {
  return this.setMultiple([config]);
};

EsnConfig.prototype.getConfigsFromAllDomains = function(configName) {
  var moduleName = this.moduleName;
  var self = this;

  return q.ninvoke(confModule, 'getAll')
    .then(function(configurations) {
      if (!configurations) {
        return [];
      }

      return configurations.map(function(configuration) {
        var configs = self._extractModuleConfigs(moduleName, configuration);
        var config = _.find(configs, { name: configName });

        if (config && !_.isUndefined(config.value)) {
          return {
            domainId: configuration.domain_id,
            config: config.value
          };
        }
      }).filter(Boolean);
    });
};

EsnConfig.prototype._extractModuleConfigs = function(modulName, confObj) {
  if (confObj) {
    var module = _.find(confObj.modules, { name: modulName });

    return module && module.configurations;
  }
};

EsnConfig.prototype._getModuleConfigsForDomain = function(moduleName) {
  const self = this;

  return fallbackModule.getConfiguration(self.domainId, self.userId).then(function(configuration) {
    return self._extractModuleConfigs(moduleName, configuration);
  });
};

EsnConfig.prototype._generateConfigTemplate = function(configuration) {
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
};

module.exports = EsnConfig;
