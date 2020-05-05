const HealthCheckMessage = require('./HealthCheckMessage');

module.exports = {
  buildHealthyMessage,
  buildUnhealthyMessage,
  buildNotFoundMessage
};

function buildHealthyMessage(componentName) {
  return new HealthCheckMessage({
    name: componentName,
    status: 'healthy',
    cause: null
  }).message;
}

function buildUnhealthyMessage(componentName, cause) {
  return new HealthCheckMessage({
    name: componentName,
    status: 'unhealthy',
    cause
  }).message;
}

function buildNotFoundMessage(componentName) {
  return new HealthCheckMessage({
    name: componentName,
    status: 'not found',
    cause: null
  }).message;
}
