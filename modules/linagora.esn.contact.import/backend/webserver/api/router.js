'use strict';

var express = require('express');

module.exports = function(dependencies, lib) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies, lib);
  var tokenMiddleware = dependencies('tokenMW');
  var importerMiddleware = require('./middleware')(dependencies, lib);

  router.post('/:type', authorizationMW.requiresAPILogin, tokenMiddleware.generateNewToken(), importerMiddleware.checkRequiredBody, controller.importContacts);

  return router;
};
