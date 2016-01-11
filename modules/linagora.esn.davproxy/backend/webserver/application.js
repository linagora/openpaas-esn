'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var FRONTEND_PATH = require('./constants').FRONTEND_PATH;

module.exports = function() {
  var application = express();

  application.use(express.static(FRONTEND_PATH));
  application.use(bodyParser.json());
  application.use(bodyParser.json({type: 'application/vcard+json', limit: '2mb'}));
  application.use(bodyParser.json({type: 'application/calendar+json'}));

  return application;
};
