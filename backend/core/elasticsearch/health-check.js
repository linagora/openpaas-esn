const { registry, buildHealthyMessage, buildUnhealthyMessage, HealthCheckProvider } = require('../health-check');
const logger = require('../logger');

module.exports = {
  register
};

const SERVICE_NAME = 'elasticsearch';
const HEALTHY_STATUSES = ['green', 'yellow'];
const UNHEALTHY_STATUSES = ['red'];

/**
 * Register ElasticSearch as a HealthCheckProvider, esClient is an async function, return ElasticSearch
 * client instance.
 * @param {function} esClient
 */
function register(esClient) {
  return registry.register(new HealthCheckProvider(SERVICE_NAME, () => checker(esClient)));
}

/**
 * Checks for ElasticSearch connection, then returns formatted result
 * @param {function} esClient
 */
function checker(esClient) {
  const message = 'Health check: Something went wrong with ElasticSearch connection.';

  return checkClusterStatus(esClient)
    .then(result => {
      if (HEALTHY_STATUSES.indexOf(result) >= 0) {
        return buildHealthyMessage(SERVICE_NAME);
      }
      if (UNHEALTHY_STATUSES.indexOf(result) >= 0) {
        return buildUnhealthyMessage(SERVICE_NAME, `ElasticSearch cluster is having a ${result} status.`);
      }
      return buildUnhealthyMessage(SERVICE_NAME, message);
    })
    .catch(error => {
      logger.debug(message, error);

      return buildUnhealthyMessage(SERVICE_NAME, error.message || error || message);
    });
}

function checkClusterStatus(esClient) {
  return esClient()
    .then(client => client.cluster.health())
    .then(result => result.status);
}
