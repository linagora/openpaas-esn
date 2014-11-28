'use strict';

var express = require('express');
var path = require('path');

function projectApplication(projectLib, dependencies) {
  var app = express();
  app.use('/projects', express.static(path.join(__dirname, '../../frontend')));
  app.set('views', path.join(__dirname, '../../frontend/views'));
  require('./routes')(app, projectLib, dependencies);
  return app;
}

module.exports = projectApplication;
