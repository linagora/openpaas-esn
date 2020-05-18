const HealthCheckMessage = require('./HealthCheckMessage');
const { STATUSES } = require('./constants');

module.exports = {
  buildHealthyMessage,
  buildUnhealthyMessage,
  buildNotFoundMessage
};

function buildHealthyMessage(componentName, details) {
  return new HealthCheckMessage({
    name: componentName,
    status: STATUSES.HEALTHY,
    cause: null,
    details
  }).message;
}

function buildUnhealthyMessage(componentName, cause, details) {
  return new HealthCheckMessage({
    name: componentName,
    status: STATUSES.UNHEALTHY,
    cause,
    details
  }).message;
}

function buildNotFoundMessage(componentName) {
  return new HealthCheckMessage({
    name: componentName,
    status: STATUSES.NOT_FOUND,
    cause: null
  }).message;
}
