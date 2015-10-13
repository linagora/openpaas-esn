'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies);

  router.get('/twitter/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize('twitter-authz', {
      failureRedirect: '/#/accounts',
      callbackURL: '/oauth/twitter/connect/callback'
    }));

  router.get('/twitter/connect/callback',
    authorizationMW.requiresAPILogin,
    passport.authorize('twitter-authz', { failureRedirect: '/#/accounts' }),
    controller.callback
  );
};
