const { registry, buildHealthyMessage, buildUnhealthyMessage, HealthCheckProvider } = require('../health-check');
const { getUrl } = require('./utils');
const { connect } = require('./index');
const logger = require('../logger');

module.exports = {
  register
};

const SERVICE_NAME = 'rabbitmq';

/**
 * Register RabbitMQ as a HealthCheckProvider, check is an async function to check for RabbitMQ
 * connection, return boolean for result.
 */
function register() {
  return registry.register(new HealthCheckProvider(SERVICE_NAME, checker));
}

/**
 * Checks for RabbitMQ connection, then returns formatted result
 */
function checker() {
  const message = 'Health check: Something went wrong with RabbitMQ connection.';

  return checkConnection()
    .then(result => (result ? buildHealthyMessage(SERVICE_NAME) : buildUnhealthyMessage(SERVICE_NAME, message)))
    .catch(error => {
      logger.error(message, error);

      return buildUnhealthyMessage(SERVICE_NAME, error.message || error || message);
    });
}

function checkConnection() {
  return getUrl()
    .then(connect)
    .then(bindEvents);
}

function bindEvents(connection) {
  return new Promise((resolve, reject) => {
    const connectionTimeout = setTimeout(function() {
      // A timeout in case all the events above don't have a response.

      return reject(new Error('Connection to RabbitMQ timeout'));
    }, 3000);

    connection.on('connect', () => {
      _cleanEventsAndTimeout();

      return resolve(true);
    });

    connection.on('disconnect', data => {
      _cleanEventsAndTimeout();

      return reject(new Error(data.err || data));
    });

    function _cleanEventsAndTimeout() {
      clearTimeout(connectionTimeout);
      connection._events = {};
    }
  }).then(result => {
    connection.close();

    return result;
  });
}

