'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var FRONTEND_PATH = require('./constants').FRONTEND_PATH;

module.exports = function(dependencies) {
  var application = express();

  require('./config/i18n')(dependencies, application);
  require('./config/views')(dependencies, application);

  application.use(express.static(FRONTEND_PATH));
  application.use(bodyParser.json());
  application.use(bodyParser.json({type: 'application/vcard+json'}));

  return application;
};
