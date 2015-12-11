'use strict';

var passport = require('passport');
var jwtAuth = require('../../core/auth/jwt');
var JwtStrategy = require('passport-jwt').Strategy;
var logger = require('../../core/logger');

module.exports.useStrategy = function() {
  return jwtAuth.getWebTokenSecret(function(err, secret) {
    if (err) {
      return logger.error('Could not use JWT strategy.', err);
    }
    var opts = {
      secretOrKey: secret,
      tokenQueryParameterName: 'jwt'
    };
    var strategy = new JwtStrategy(opts, function(jwtPayload, done) {
      return done(null, jwtPayload);
    });
    passport.use(strategy);
  });
};
