'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var davMiddleware = dependencies('davproxy').davMiddleware;
  var controller = require('./controller')(dependencies);

  var router = express.Router();

  router.get('/:addressBookId/:contactId/avatar',
    authorizationMW.requiresAPILogin,
    davMiddleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.getAvatar);

  return router;
};
