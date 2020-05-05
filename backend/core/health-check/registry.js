const HealthCheckProvider = require('./HealthCheckProvider');
const logger = require('../../core/logger');

const providers = {};

module.exports = {
  getCheckers,
  getAllCheckers,
  getAllServiceNames,
  checkAvailable,
  register
};

/**
 * Register services in object providers
 * @param {Object} provider
 */
function register(provider) {
  if (!(provider instanceof HealthCheckProvider)) {
    logger.debug(`Failed to register health checker for service ${provider.name}: The provider must be an instance of HealthCheckProvider`);

    return;
  }

  if (providers[provider.name]) {
    logger.debug(`Failed to register health checker for service ${provider.name}: The provider with name ${provider.name} already registered`);

    return;
  }

  providers[provider.name] = provider.checker;
}

/**
 * Get the corresponding checker function via name of service
 * @param {string} serviceNames
 */
function getCheckers(serviceNames) {
  return serviceNames.map(name => providers[name]).filter(Boolean);
}

function getAllCheckers() {
  return Object.values(providers);
}

function checkAvailable(name) {
  return Boolean(providers[name]);
}

function getAllServiceNames() {
  return Object.keys(providers);
}
