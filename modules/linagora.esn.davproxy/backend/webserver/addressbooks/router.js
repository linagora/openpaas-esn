'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var middleware = require('../proxy/middleware')(dependencies);
  var controller = require('./controller')(dependencies);

  router.get('/:bookId/contacts/:contactId.vcf', authorizationMW.requiresAPILogin, middleware.generateNewToken, middleware.getDavEndpoint, controller.getContact);
  router.put('/:bookId/contacts/:contactId.vcf', authorizationMW.requiresAPILogin, middleware.generateNewToken, middleware.getDavEndpoint, controller.updateContact);
  router.delete('/:bookId/contacts/:contactId.vcf', authorizationMW.requiresAPILogin, middleware.generateNewToken, middleware.getDavEndpoint, controller.deleteContact);
  router.all('/*', authorizationMW.requiresAPILogin, middleware.generateNewToken, middleware.getDavEndpoint, controller.defaultHandler);

  return router;
};
