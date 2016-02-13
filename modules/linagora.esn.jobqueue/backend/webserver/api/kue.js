'use strict';

var express = require('express');

module.exports = function(lib, dependencies) {

  var authorizationMW = dependencies('authorizationMW');

  var app = express();
  app.use(authorizationMW.requiresAPILogin);
  lib.initJobQueue().then(function() {
    app.use('/ui', lib.kue.app);
  });

  return app;
};
