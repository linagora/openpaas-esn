const logger = require('../logger');

const registeredResources = {};

module.exports = {
  register,
  getAll
};

/**
 * Register elasticsearch reindexing for a resource
 * @param {String} resourceType Resource type
 * @param {Object} data         Register data contains:
 *                              - name: A required string for index name. For example: users.idx
 *                              - buildReindexOptionsFunction: A required function to build reindex options
 */
function register(resourceType, data) {
  if (registeredResources[resourceType]) {
    logger.error(`Error while registering elasticsearch reindexing for the resource ${resourceType}: the resource type is taken`);

    return;
  }

  if (!data.name) {
    logger.error(`Error while registering elasticsearch reindexing for the resource ${resourceType}: resource index name is required`);

    return;
  }

  if (!data.buildReindexOptionsFunction || typeof data.buildReindexOptionsFunction !== 'function') {
    logger.error(`Error while registering elasticsearch reindexing for the resource ${resourceType}: buildReindexOptionsFunction must be a function`);

    return;
  }

  registeredResources[resourceType] = data;
}

function getAll() {
  return registeredResources;
}
