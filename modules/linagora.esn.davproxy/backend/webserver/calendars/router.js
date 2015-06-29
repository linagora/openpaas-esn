'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();
  var proxy = require('../proxy')(dependencies);
  router.all('/*', proxy.handle('calendars'));

  return router;
};
