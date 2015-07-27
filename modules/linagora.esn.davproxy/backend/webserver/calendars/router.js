'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();
  var authorizationMW = dependencies('authorizationMW');
  var proxy = require('../proxy')(dependencies)('calendars');
  var davMiddleware = dependencies('davserver').davMiddleware;

  router.all('/*', authorizationMW.requiresAPILogin, davMiddleware.generateNewToken, davMiddleware.getDavEndpoint, proxy.handle({json: true}));

  return router;
};
