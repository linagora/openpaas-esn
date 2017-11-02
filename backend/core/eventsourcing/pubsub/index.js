const logger = require('../../logger');
const pubsub = require('../../pubsub');
const elasticsearchHandler = require('./elasticsearch');
const mongodbHandler = require('./mongodb');
const { refineEvent } = require('../util');

module.exports = {
  init
};

function init() {
  logger.info('Initializing the eventsourcing pubsub');
  pubsub.local.client.onAny(listener);
}

function listener(name, data = {}) {
  const event = refineEvent(name, data);

  elasticsearchHandler.handle(event);
  mongodbHandler.handle(event);
}
