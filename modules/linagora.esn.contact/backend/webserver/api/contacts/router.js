'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var tokenMiddleware = dependencies('tokenMW');
  var davMiddleware = dependencies('davserver').davMiddleware;
  var controller = require('./controller')(dependencies);

  var router = express.Router();

  router.get('/:addressBookId/:addressbookName/:contactId/avatar',
    authorizationMW.requiresAPILogin,
    davMiddleware.getDavEndpoint,
    tokenMiddleware.generateNewToken(),
    controller.getAvatar);

  return router;
};
