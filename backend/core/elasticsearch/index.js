const listeners = require('./listeners');
const reindexRegistry = require('./reindex-registry');

const {
  addDocumentToIndex,
  client,
  getClient,
  reconfig,
  reindex,
  removeDocumentFromIndex,
  removeDocumentsByQuery,
  searchDocuments,
  updateClient
} = require('./elasticsearch');

module.exports = {
  addDocumentToIndex,
  client,
  getClient,
  listeners,
  reconfig,
  reindex,
  reindexRegistry,
  removeDocumentFromIndex,
  removeDocumentsByQuery,
  searchDocuments,
  updateClient
};
