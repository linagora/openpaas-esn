'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');

  router.get('/twitter/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize('twitter-authz', { failureRedirect: '/#/accounts' }));

  router.get('/twitter/connect/callback',
    authorizationMW.requiresAPILogin,
    passport.authorize('twitter-authz', { failureRedirect: '/#/accounts' }),
    function(req, res) {
      res.redirect('/#/accounts');
    }
  );
};
