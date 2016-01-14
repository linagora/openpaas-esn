'use strict';

var passport = require('passport');
var jwtAuth = require('../../core/auth/jwt');
var JwtStrategy = require('passport-jwt').Strategy;
var logger = require('../../core/logger');

function optionsResolver(foundCallback) {
  jwtAuth.getWebTokenConfig(function(err, config) {
    if (err) {
      logger.error('Could not find the JWT config.', err);
      foundCallback(err);
    } else {
      foundCallback(null, {
        secretOrKey: config.publicKey,
        tokenQueryParameterName: 'jwt',
        algorithms: [config.algorithm]
      });
    }
  });
}

module.exports.useStrategy = function() {

  passport.use(new JwtStrategy(optionsResolver, function(jwtPayload, done) {
    return done(null, jwtPayload);
  }));

};
