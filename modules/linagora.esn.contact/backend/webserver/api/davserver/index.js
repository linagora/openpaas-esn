'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');
  var router = express.Router();

  router.get('/api/davserver', authorizationMW.requiresAPILogin, controller.getDavUrl);

  return router;
};

