'use strict';

var passport = require('passport');
var jwtAuth = require('../../core/auth/jwt');
var JwtStrategy = require('passport-jwt').Strategy;
var logger = require('../../core/logger');

module.exports.useStrategy = function() {
  return jwtAuth.getWebTokenConfig(function(err, config) {
    if (err) {
      return logger.error('Could not use JWT strategy.', err);
    }
    var opts = {
      secretOrKey: config.publicKey,
      tokenQueryParameterName: 'jwt',
      algorithms: [config.algorithm]
    };
    var strategy = new JwtStrategy(opts, function(jwtPayload, done) {
      return done(null, jwtPayload);
    });
    passport.use(strategy);
  });
};
