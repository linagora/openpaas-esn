'use strict';

var express = require('express');

function projectApplication(projectLib, dependencies) {
  var app = express();
  require('./routes')(app, projectLib, dependencies);
  return app;
}

module.exports = projectApplication;
