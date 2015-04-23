'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./thing.controller')(dependencies);
  var middleware = require('./thing.middleware')(dependencies);

  var router = express.Router();

  router.get('/api/things/:id', middleware.passThrough, controller.getOne);
  router.post('/api/things/', middleware.passThrough, controller.create);
  router.delete('/api/things/:id', middleware.passThrough, controller.remove);

  return router;
};
