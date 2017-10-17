const logger = require('../../logger');
const pubsub = require('../../pubsub');
const elasticsearchHandler = require('./elasticsearch');

module.exports = {
  init
};

function init() {
  logger.info('Initializing the eventsourcing pubsub');
  registerLocalListener();
}

function registerLocalListener() {
  pubsub.local.client.onAny(elasticsearchHandler.handle);
}

