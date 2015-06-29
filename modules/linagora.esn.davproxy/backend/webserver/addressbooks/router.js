'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  var contacts = require('./controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');

  router.delete('/:bookId/contacts/:contactId.vcf', authorizationMW.requiresAPILogin, contacts.remove);

  var proxy = require('../proxy')(dependencies);
  router.all('/*', proxy.handle('addressbooks'));

  return router;
};
