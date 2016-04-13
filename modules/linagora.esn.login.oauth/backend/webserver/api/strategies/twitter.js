'use strict';

var passport = require('passport');
var STRATEGY_NAME = 'twitter-login';

module.exports = function(router, dependencies) {

  var logger = dependencies('logger');
  logger.info('Initializing Twitter Auth routes');

  router.get('/twitter/auth', passport.authenticate(STRATEGY_NAME, {
    scope: 'email'
  }));

  router.get('/twitter/auth/callback', passport.authenticate(STRATEGY_NAME, {
    successRedirect: '/',
    failureRedirect: '/error'
  }));
};
