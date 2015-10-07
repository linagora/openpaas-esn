'use strict';

var express = require('express');

module.exports = function(dependencies) {
  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies);

  var router = express.Router();

  router.get('/list', authorizationMW.requiresAPILogin, controller.getList);

  require('./twitter')(router, dependencies);

  return router;
};
