'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var logger = dependencies('logger');
  logger.info('Initializing Facebook Auth routes');

  router.get('/facebook/auth', passport.authenticate('facebook-login', {
    scope: 'email'
  }));

  router.get('/facebook/auth/callback', passport.authenticate('facebook-login', {
    successRedirect: '/',
    failureRedirect: '/error'
  }));
};
