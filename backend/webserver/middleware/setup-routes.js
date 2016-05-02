'use strict';

var core = require('../../core');

function setupRoute(app) {
  app.get('/', function(req, res, next) {
    if (core.configured()) {
      return next();
    }
    res.render('setup/index');
  });
}

module.exports = setupRoute;
