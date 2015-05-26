'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');

  var router = express.Router();

  router.get('/api/info', authorizationMW.requiresAPILogin, controller.getDavUrl);

  return router;
};
