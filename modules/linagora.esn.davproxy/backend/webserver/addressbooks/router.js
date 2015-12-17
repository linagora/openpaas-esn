'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var middleware = require('../proxy/middleware')(dependencies);
  var davMiddleware = dependencies('davserver').davMiddleware;
  var controller = require('./controller')(dependencies);

  router.get('/:bookHome/:bookName/:contactId.vcf', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.getContact);
  router.put('/:bookHome/:bookName/:contactId.vcf', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.updateContact);
  router.delete('/:bookHome/:bookName/:contactId.vcf', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.deleteContact);
  router.get('/:bookHome/:bookName.json', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.getContacts);
  router.all('/*', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.defaultHandler);

  return router;
};
