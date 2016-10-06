'use strict';

var _ = require('lodash');

var Adapter = require('./adapter');
var EsnConfig = require('./esn-config');
var constants = require('./constants');
var fallbackModule = require('./fallback');

function _extractPublicConfigs(module) {
  var moduleConfigs = constants.CONFIG_METADATA[module.name];

  if (!moduleConfigs) {
    return;
  }

  module.configurations = _.filter(module.configurations, function(config) {
    return moduleConfigs[config.name] && moduleConfigs[config.name].public;
  });

  return module;
}

function getConfigsForUser(user) {
  return fallbackModule.findByDomainId(user.preferredDomainId)
    .then(function(configuration) {
      if (configuration) {
        configuration.modules = _.map(configuration.modules, _extractPublicConfigs).filter(Boolean);
      }

      return configuration;
    });
}

module.exports = function(configName) {
  return new Adapter(configName);
};
module.exports.EsnConfig = EsnConfig;
module.exports.constants = constants;
module.exports.getConfigsForUser = getConfigsForUser;
