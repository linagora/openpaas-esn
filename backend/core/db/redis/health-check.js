const { registry, buildHealthyMessage, buildUnhealthyMessage, HealthCheckProvider } = require('../../health-check');
const logger = require('../../logger');

module.exports = {
  register
};

const SERVICE_NAME = 'redis';
const HEALTHY_RESPONSE = 'PONG';
/**
 * Register Redis as a HealthCheckProvider, client is an async function, return Redis client.
 * @param {function} client
 */
function register(client) {
  return registry.register(new HealthCheckProvider(SERVICE_NAME, () => checker(client)));
}

/**
 * Checks for Redis connection, then returns formatted result
 * @param {function} client
 */
function checker(client) {
  const message = 'Health check: Something went wrong with Redis connection.';

  return checkConnection(client)
    .then(result => (result ? buildHealthyMessage(SERVICE_NAME) : buildUnhealthyMessage(SERVICE_NAME, message)))
    .catch(error => {
      logger.debug(message, error);

      return buildUnhealthyMessage(SERVICE_NAME, error.message || error || message);
    });
}

function checkConnection(client) {
  return new Promise((resolve, reject) => {
    client().ping(function(err, value) {
      if (err) {
        reject(err);
      }
      if (value && value === HEALTHY_RESPONSE) {
        resolve(true);
      }
      reject(`Redis ping did not return expected value: ${HEALTHY_RESPONSE}`);
    });
  });
}
