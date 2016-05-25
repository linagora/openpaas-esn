'use strict';

var documentstore = require('../controllers/document-store');
var documentstoreMiddleware = require('../middleware/document-store');

module.exports = function(router) {
  router.put('/document-store/connection', [documentstoreMiddleware.failIfConfigured, documentstore.store]);
  router.get('/document-store/connection/:hostname/:port/:dbname', documentstoreMiddleware.failIfConfigured);
  router.put('/document-store/connection/:hostname/:port/:dbname', [documentstoreMiddleware.failIfConfigured, documentstore.test]);
};
