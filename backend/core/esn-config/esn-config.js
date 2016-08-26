'use strict';

var q = require('q');
var _ = require('lodash');
var dotty = require('dotty');
var confModule = require('../configuration');
var mongoose = require('mongoose');
var constants = require('./constants');
var Configuration;

try {
  Configuration = mongoose.model('Configuration');
} catch (e) {
  Configuration = require('../db/mongo/models/configuration');
}

function EsnConfig(moduleName, domainId) {
  this.moduleName = moduleName || constants.DEFAULT_MODULE;
  this.domainId = domainId || constants.DEFAULT_DOMAIN_ID;
  this.confModule = confModule;
}

EsnConfig.prototype.setModuleName = function(name) {
  this.moduleName = name;
};

EsnConfig.prototype.setDomainId = function(id) {
  this.domainId = id;
};

EsnConfig.prototype.setConfModule = function(confModule) {
  this.confModule = confModule;
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

    if (config && config.value) {
      return config.value;
    }
  });
};

EsnConfig.prototype.setMultiple = function(configsToUpdate) {
  var moduleName = this.moduleName;
  var domainId = this.domainId;
  var confModule = this.confModule;

  return q.ninvoke(confModule, 'findByDomainId', domainId)
    .then(function(configuration) {
      var moduleTemplate = {
        name: moduleName,
        configurations: []
      };

      configuration = configuration || new Configuration({
        domain_id: domainId,
        modules: [moduleTemplate]
      });

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
  var confModule = this.confModule;
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

        if (config && config.value) {
          return config.value;
        }
      }).filter(Boolean);
    });
};

EsnConfig.prototype._extractModuleConfigs = function(modulName, confObj) {
  if (confObj) {
    var module = _.find(confObj.modules, { name: modulName });

    if (module && module.configurations) {
      return module.configurations;
    }
  }
};

EsnConfig.prototype._getModuleConfigsForDomain = function(moduleName, domainId) {
  var self = this;
  var confModule = this.confModule;

  return q.ninvoke(confModule, 'findByDomainId', domainId)
    .then(function(configuration) {
      return self._extractModuleConfigs(moduleName, configuration);
    });
};

module.exports = EsnConfig;
