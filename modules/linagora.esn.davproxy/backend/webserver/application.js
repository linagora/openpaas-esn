'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var restreamer = require('./proxy/restreamer');

module.exports = function(dependencies) {
  var application = express();

  application.use(bodyParser.json());
  application.use(restreamer());

  return application;
};
