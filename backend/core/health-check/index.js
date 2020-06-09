const registry = require('./registry');
const { buildHealthyMessage, buildUnhealthyMessage, buildNotFoundMessage } = require('./utils');
const Q = require('q');
const HealthCheckMessage = require('./HealthCheckMessage');
const HealthCheckProvider = require('./HealthCheckProvider');
const { STATUSES } = require('./constants');

module.exports = {
  checkWithDetails,
  check,
  registry,
  HealthCheckProvider,
  HealthCheckMessage,
  buildHealthyMessage,
  buildUnhealthyMessage,
  getRegisteredServiceNames,
  generateGlobalStatus,
  STATUSES
};

/**
 * Check for all services in serviceNames. If serviceNames has no element returns all services.
 * If service not found, returns formatted message with status not found
 * @param {array} serviceNames
 */
function checkWithDetails(serviceNames = []) {
  let checkers = registry.getAllCheckers();
  let availableServices = registry.getRegisteredServiceNames();
  let unavailableServices = [];
  if (serviceNames.length) {
    checkers = registry.getCheckers(serviceNames);
    availableServices = serviceNames.filter(name => registry.checkAvailable(name));
    unavailableServices = serviceNames.filter(name => !registry.checkAvailable(name));
  }

  return Q.allSettled(checkers.map(checker => checker()))
    .then(results => results.map((result, index) => {
      if (result.state === 'fulfilled') {
        return result.value;
      }

      return buildUnhealthyMessage(availableServices[index], result.value || 'Error: Checker promise cannot be fulfilled');
    }))
    .then(results => [
      ...results,
      ...unavailableServices.map(serviceName => buildNotFoundMessage(serviceName))
    ]);
}

/**
 * Check for all services, but returns no details
 * @param {array} serviceNames
 */
function check(serviceNames = []) {
  return checkWithDetails(serviceNames)
    .then(results => results.map(result => {
      result.details = null;
      return result;
    }));
}

/**
 * Get all registered health provider name.
 */
function getRegisteredServiceNames() {
  return registry.getRegisteredServiceNames();
}

/**
 * Generate the global status for all services. Return `unhealthy` if at least one service is unhealthy and otherwise.
 * @param {object} serviceHealthChecks
 */
function generateGlobalStatus(serviceHealthChecks) {
  if (serviceHealthChecks.some(health => health.status === STATUSES.UNHEALTHY)) {
    return STATUSES.UNHEALTHY;
  }
  return STATUSES.HEALTHY;
}
