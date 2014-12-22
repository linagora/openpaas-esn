'use strict';

var express = require('express');

function webserver(lib, dependencies) {
  var app = express();

  require('./routes')(app, lib, dependencies);
  return app;
}

module.exports = webserver;
