const uuidV4 = require('uuid/v4');
const CONSTANTS = require('../constants');
const elasticsearch = require('../../elasticsearch');
const logger = require('../../logger');
const { Event } = require('../../models');

module.exports = {
  handle
};

function handle(eventName, data = {}) {
  let event;

  if (data instanceof Event) {
    event = data;
    event.name = eventName;
  } else {
    // avoid concrete value error on ES parse
    data = (typeof data === 'object') ? data : { value: data };
    event = new Event(data.uuid, eventName, data.objectType, data.id, data, {}, data.timestamp);
  }

  event.uuid = event.uuid || uuidV4();

  // Note: We need another client for such data to index which may go in another instance and not the business one
  elasticsearch.addDocumentToIndex(event, {
    index: CONSTANTS.ELASTICSEARCH.INDEX_NAME,
    type: CONSTANTS.ELASTICSEARCH.INDEX_TYPE,
    id: event.uuid
  }, err => {
    if (err) {
      logger.error(`Event ${eventName}:${event.uuid} can not be indexed`, err);

      return;
    }

    logger.debug(`Event ${eventName}:${event.uuid} has been indexed`);
  });
}
