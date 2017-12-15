'use strict';

const Adapter = require('./adapter');
const EsnConfig = require('./esn-config');
const constants = require('./constants');
const fallbackModule = require('./fallback');
const configurations = require('./configurations');
const registry = require('./registry');
const validator = require('./validator');
const metadata = require('./metadata');

registry.register('core', metadata);

module.exports = function(configName) {
  return new Adapter(configName);
};

module.exports.EsnConfig = EsnConfig;
module.exports.constants = constants;
module.exports.getConfigsForUser = getConfigsForUser;
module.exports.configurations = configurations;
module.exports.registry = registry;
module.exports.validator = validator;

function getConfigsForUser(user) {
  return fallbackModule.getConfiguration(user.preferredDomainId, user._id);
}
