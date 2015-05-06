'use strict';

var express = require('express');
var path = require('path');
var FRONTEND_PATH = path.normalize(__dirname + '/../../frontend');

function contactApplication(contactLib, dependencies) {
  var app = express();

  app.use('/contacts', express.static(FRONTEND_PATH));
  app.set('views', FRONTEND_PATH + '/views');
  require('./routes')(app, contactLib, dependencies);
  return app;
}

module.exports = contactApplication;
