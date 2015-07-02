'use strict';

var express = require('express');

module.exports = function(lib, dependencies) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(lib, dependencies);
  var middleware = require('./middleware')(lib, dependencies);

  router.delete('/tasks/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.isUserTask, controller.cancel);

  return router;
};
