const { registry, buildHealthyMessage, buildUnhealthyMessage, HealthCheckProvider } = require('../health-check');
const { getRabbitMQUrl } = require('./utils');
const logger = require('../logger');
const axios = require('axios');

module.exports = {
  register
};

/**
 * Register RabbitMQ as a HealthCheckProvider, check is an async function to check for RabbitMQ
 * connection, return boolean for result.
 */
function register() {
  return registry.register(new HealthCheckProvider('rabbitmq', checker));
}

/**
 * Checks for RabbitMQ connection, then returns formatted result
 */
function checker() {
  const message = 'AMQP: Something went wrong with RabbitMQ connection.';

  return checkConnection()
    .then(result => (result ? buildHealthyMessage('rabbitmq') : buildUnhealthyMessage('rabbitmq', message)))
    .catch(error => {
      logger.error(message, error);

      return buildUnhealthyMessage('rabbitmq', error.message || error || message);
    });
}

function checkConnection() {
  const BASE_HEALTH_CHECK_PATH = 'api/aliveness-test/%2f';
  return getRabbitMQUrl()
    .then(url => {
      const httpClient = axios.create({
        baseURL: url,
        timeout: 3000
      });

      return httpClient.get(BASE_HEALTH_CHECK_PATH);
    })
    .then(result => result.status === 200 && result.data.status === 'ok');
}
