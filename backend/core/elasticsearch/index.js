const listeners = require('./listeners');

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

console.log(4444444444, require('./elasticsearch'));


module.exports = {
  addDocumentToIndex,
  client,
  getClient,
  listeners,
  reconfig,
  reindex,
  removeDocumentFromIndex,
  removeDocumentsByQuery,
  searchDocuments,
  updateClient
};
