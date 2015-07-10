'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();
  var proxy = require('../proxy')(dependencies)('calendars');
  var middleware = require('../proxy/middleware')(dependencies);

  router.all('/*', middleware.getDavEndpoint, proxy.handle());

  return router;
};
