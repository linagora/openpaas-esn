const q = require('q');
const { INDEX_NAME, INDEX_TYPE } = require('../constants').ELASTICSEARCH;
const { addDocumentToIndex, reindexRegistry } = require('../../elasticsearch');
const { listByCursor } = require('../events');
const logger = require('../../logger');

module.exports = {
  handle,
  registerReindexTask
};

function handle(event) {

  // Note: We need another client for such data to index which may go in another instance and not the business one
  q.denodeify(addDocumentToIndex)(event, {
    index: INDEX_NAME,
    type: INDEX_TYPE,
    id: event.uuid
  })
    .then(() => logger.debug(`Event ${event.name}:${event.uuid} has been indexed`))
    .catch(err => logger.error(`Event ${event.name}:${event.uuid} can not be indexed`, err));
}

function registerReindexTask() {
  reindexRegistry.register(INDEX_TYPE, {
    name: INDEX_NAME,
    buildReindexOptionsFunction: _buildElasticsearchReindexOptions
  });
}

function _buildElasticsearchReindexOptions() {
  const options = {
    name: INDEX_NAME,
    type: INDEX_TYPE,
    getId: event => event.uuid,
    denormalize
  };
  const cursor = listByCursor();

  options.next = () => cursor.next();

  return Promise.resolve(options);
}

function denormalize(event) {
  event = event.toObject();

  delete event._id;

  return event;
}
