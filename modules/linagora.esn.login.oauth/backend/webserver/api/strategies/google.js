'use strict';

var passport = require('passport');
var STRATEGY_NAME = 'google-login';

module.exports = function(router, dependencies) {

  var logger = dependencies('logger');
  logger.info('Initializing Google Auth routes');

  router.get('/google/auth', passport.authenticate(STRATEGY_NAME, {
    scope: ['profile', 'email']
  }));

  router.get('/google/auth/callback', passport.authenticate(STRATEGY_NAME, {
    successRedirect: '/',
    failureRedirect: '/error'
  }));
};
