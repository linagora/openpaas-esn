'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var router = express.Router();

  var contacts = require('./controller')(dependencies);
  router.get('/:bookId/contacts', authorizationMW.requiresAPILogin, contacts.list);

  var proxy = require('../proxy')(dependencies);
  router.all('/*', proxy.handle('addressbooks'));

  return router;
};
