const q = require('q');
const CONSTANTS = require('../constants');
const elasticsearch = require('../../elasticsearch');
const logger = require('../../logger');

module.exports = {
  handle
};

function handle(event) {

  // Note: We need another client for such data to index which may go in another instance and not the business one
  q.denodeify(elasticsearch.addDocumentToIndex)(event, {
    index: CONSTANTS.ELASTICSEARCH.INDEX_NAME,
    type: CONSTANTS.ELASTICSEARCH.INDEX_TYPE,
    id: event.uuid
  })
    .then(() => logger.debug(`Event ${event.name}:${event.uuid} has been indexed`))
    .catch(err => logger.error(`Event ${event.name}:${event.uuid} can not be indexed`, err));
}
