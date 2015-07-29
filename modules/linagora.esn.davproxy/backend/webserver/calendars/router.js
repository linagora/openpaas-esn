'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();
  var proxy = require('../proxy')(dependencies)('calendars');
  var davMiddleware = dependencies('davserver').davMiddleware;

  router.all('/*', davMiddleware.getDavEndpoint, proxy.handle());

  return router;
};
