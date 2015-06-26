'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  var contacts = require('./controller')(dependencies);
  router.delete('/:bookId/contacts/:contactId.vcf', contacts.remove);

  var proxy = require('../proxy')(dependencies);
  router.all('/*', proxy.handle('addressbooks'));

  return router;
};
