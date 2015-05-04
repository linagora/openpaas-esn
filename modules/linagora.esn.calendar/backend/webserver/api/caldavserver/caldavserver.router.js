'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./caldavserver.controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');

  var router = express.Router();

  router.get('/api/caldavserver', authorizationMW.requiresAPILogin, controller.getCaldavUrl);

  return router;
};
