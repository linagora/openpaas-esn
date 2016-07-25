'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var application = express();

  require('./config/i18n')(dependencies, application);
  require('./config/views')(dependencies, application);

  return application;
};
