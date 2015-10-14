'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var logger = dependencies('logger');
  var controller = require('./controller')(dependencies);

  router.get('/twitter/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize('twitter-authz', {
      failureRedirect: '/#/accounts?status=error&provider=twitter&context=connect&action=redirect',
      callbackURL: '/oauth/twitter/connect/callback'
    })
  );

  router.get('/twitter/connect/callback',
    authorizationMW.requiresAPILogin,
    function(req, res, next) {
      passport.authorize('twitter-authz', function(err, user, info) {
        // do not let passport returning 401 in case the user denied access
        // we do not user failureRedirect to be able to call our middlewares and controllers if needed
        logger.debug('Twitter Passport error', err);
        logger.debug('Twitter Passport user', user);
        logger.debug('Twitter Passport info', info);
        next();
      })(req, res, next);
    },
    controller.callback
  );
};
