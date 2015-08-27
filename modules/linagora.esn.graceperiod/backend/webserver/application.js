'use strict';

var express = require('express');
var FRONTEND_PATH = require('./constants').FRONTEND_PATH;

module.exports = function(dependencies) {
  var app = express();
  app.use(express.static(FRONTEND_PATH));

  return app;
};
