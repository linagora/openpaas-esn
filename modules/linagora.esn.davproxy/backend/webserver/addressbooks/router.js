'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var middleware = require('../proxy/middleware')(dependencies);

  var proxy = require('../proxy')(dependencies);
  router.all('/*', authorizationMW.requiresAPILogin, middleware.generateNewToken, proxy.handle('addressbooks'));

  return router;
};
