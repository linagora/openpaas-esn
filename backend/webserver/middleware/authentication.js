'use strict';

//
// Authenticate the user using all the configuration-level defined strategies.
//

var passport = require('passport');
var config = require('../../core').config('default');

exports.isAuthenticated = function(req, res, next) {
  var strategies = config.auth && config.auth.strategies ? config.auth.strategies : ['local'];
  return passport.authenticate(strategies, {failureRedirect: '/login', failureFlash: 'Invalid login or password.'})(req, res, next);
};
