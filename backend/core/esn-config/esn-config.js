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

EsnConfig.prototype.setDomainId = function(id) {
  this.domainId = id;
};

EsnConfig.prototype.getMultiple = function(configNames) {
  var domainId = this.domainId;
  var moduleName = this.moduleName;

  return this._getModuleConfigsForDomain(moduleName, domainId)
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
  var moduleName = this.moduleName;
  var domainId = this.domainId;

  return q.ninvoke(confModule, 'findByDomainId', domainId)
    .then(function(configuration) {
      var moduleTemplate = {
        name: moduleName,
        configurations: []
      };

      configuration = configuration || {
        domain_id: domainId,
        modules: [moduleTemplate]
      };

      var module = _.find(configuration.modules, { name: moduleName });

      if (!module) {
        configuration.modules = configuration.modules || [];
        configuration.modules.unshift(moduleTemplate);
        module = configuration.modules[0];
      }

      configsToUpdate.forEach(function(config) {
        var conf = _.find(module.configurations, { name: config.name });

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
        return self._extractModuleConfigs(moduleName, configuration);
      }).filter(Boolean);
    })
    .then(function(configurations) {
      return configurations.map(function(configuration) {
        var config = _.find(configuration, { name: configName });

        return config && config.value;
      }).filter(function(value) {
        return !_.isUndefined(value);
      });
    });
};

EsnConfig.prototype._extractModuleConfigs = function(modulName, confObj) {
  if (confObj) {
    var module = _.find(confObj.modules, { name: modulName });

    return module && module.configurations;
  }
};

EsnConfig.prototype._getModuleConfigsForDomain = function(moduleName, domainId) {
  var self = this;

  return fallbackModule.findByDomainId(domainId).then(function(configuration) {
      return self._extractModuleConfigs(moduleName, configuration);
    });
};

module.exports = EsnConfig;
