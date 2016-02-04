'use strict';

var express = require('express');

module.exports = function(lib, dependencies) {
  var authorizationMW = dependencies('authorizationMW');
  var router = express.Router();
  router.get('/', authorizationMW.requiresAPILogin, function(req, res) {
    res.redirect('/jobqueue/ui');
  });
  return router;
};
