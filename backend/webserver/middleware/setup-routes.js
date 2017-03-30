'use strict';

var core = require('../../core');

const assetRegistry = core.assets;

function setupRoute(app) {
  app.get('/', function(req, res, next) {
    if (core.configured()) {
      return next();
    }

    res.locals.assets = assetRegistry.app('setup');
    res.render('setup/index');
  });
}

module.exports = setupRoute;
