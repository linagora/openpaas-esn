const HealthCheckMessage = require('./HealthCheckMessage');

module.exports = {
  buildHealthyMessage,
  buildUnhealthyMessage,
  buildNotFoundMessage
};

function buildHealthyMessage(componentName, details) {
  return new HealthCheckMessage({
    name: componentName,
    status: 'healthy',
    cause: null,
    details
  }).message;
}

function buildUnhealthyMessage(componentName, cause, details) {
  return new HealthCheckMessage({
    name: componentName,
    status: 'unhealthy',
    cause,
    details
  }).message;
}

function buildNotFoundMessage(componentName) {
  return new HealthCheckMessage({
    name: componentName,
    status: 'not found',
    cause: null
  }).message;
}
