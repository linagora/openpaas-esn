'use strict';

var express = require('express');
var bodyParser = require('body-parser');

module.exports = function() {
  var application = express();

  application.use(bodyParser.json());
  application.use(bodyParser.json({type: 'application/vcard+json'}));
  application.use(bodyParser.json({type: 'application/calendar+json'}));

  return application;
};
