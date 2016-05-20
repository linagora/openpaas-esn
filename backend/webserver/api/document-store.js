'use strict';

var documentstore = require('../controllers/document-store');

module.exports = function(router) {
  router.put('/document-store/connection', [documentstore.failIfConfigured, documentstore.store]);
  router.get('/document-store/connection/:hostname/:port/:dbname', [documentstore.failIfConfigured, documentstore.test]);
};
