'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var logger = dependencies('logger');
  var controller = require('../controller')(dependencies);

  router.get('/google/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize('google-authz', {
      accessType: 'offline',
      prompt: 'consent',
      scope: ['profile', 'https://www.google.com/m8/feeds'],
      failureRedirect: '/#/accounts?status=error&provider=google&context=connect&action=redirect',
      callbackURL: '/oauth/google/connect/callback'
    })
  );

  router.get('/google/connect/callback',
    authorizationMW.requiresAPILogin,
    function(req, res, next) {
      passport.authorize('google-authz', function(err) {
        logger.debug('google Passport error', err);
        next();
      })(req, res, next);
    },
    controller.finalizeWorkflow.bind(null, 'google')
  );
};
