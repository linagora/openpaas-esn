'use strict';

const Adapter = require('./adapter');
const EsnConfig = require('./esn-config');
const constants = require('./constants');
const fallbackModule = require('./fallback');
const configurations = require('./configurations');
const registry = require('./registry');

module.exports = function(configName) {
  return new Adapter(configName);
};

module.exports.EsnConfig = EsnConfig;
module.exports.constants = constants;
module.exports.getConfigsForUser = getConfigsForUser;
module.exports.configurations = configurations;
module.exports.registry = registry;

function getConfigsForUser(user) {
  return fallbackModule.getConfiguration(user.preferredDomainId, user._id);
}
