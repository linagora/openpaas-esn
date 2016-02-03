'use strict';

var express = require('express');

module.exports = function(lib, dependencies) {

  var authorizationMW = dependencies('authorizationMW');

  var app = express();
  app.use(authorizationMW.requiresAPILogin);
  app.use('/ui', lib.kue.app);

  return app;
};
