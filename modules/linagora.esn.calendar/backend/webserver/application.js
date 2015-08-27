'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var application = express();

  // This needs to be initialized before the body parser
  require('./config/i18n')(dependencies, application);
  require('./config/views')(dependencies, application);

  return application;
};
