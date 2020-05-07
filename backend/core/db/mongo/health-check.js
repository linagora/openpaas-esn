const { registry, buildHealthyMessage, buildUnhealthyMessage, HealthCheckProvider } = require('../../health-check');
const mongoose = require('mongoose');
const logger = require('../../logger');

module.exports = {
  register
};

const SERVICE_NAME = 'mongodb';
/**
 * Register MongoDB as a HealthCheckProvider
 */
function register() {
  return registry.register(new HealthCheckProvider(SERVICE_NAME, checker));
}

/**
 * Checks for MongoDB connection, then returns formatted result
 */
function checker() {
  const message = 'Health check: Something went wrong with MongoDB connection.';

  return checkConnection()
    .then(result => (result ? buildHealthyMessage(SERVICE_NAME) : buildUnhealthyMessage(SERVICE_NAME, message)))
    .catch(error => {
      logger.debug(message, error);

      return buildUnhealthyMessage(SERVICE_NAME, error.message || error || message);
    });
}

function checkConnection() {
  return mongoose.connection.db.admin().ping().then(result => !!result.ok);
}
