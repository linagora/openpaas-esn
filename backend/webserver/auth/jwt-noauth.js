'use strict';

const jwtAuth = require('../../core/auth/jwt'),
      logger = require('../../core/logger'),
      JwtStrategy = require('passport-jwt').Strategy;

module.exports = {
  strategy: new JwtStrategy(optionsResolver, (jwtPayload, done) => done(null, jwtPayload)),
  optionsResolver
};

/////

function optionsResolver(foundCallback) {
  jwtAuth.getWebTokenConfig(function(err, config) {
    if (err) {
      logger.error('Could not find the JWT config.', err);

      foundCallback(err);
    } else {
      foundCallback(null, {
        secretOrKey: config.publicKey,
        tokenQueryParameterName: 'jwt',
        authScheme: 'Bearer',
        algorithms: [config.algorithm],
        ignoreExpiration: true
      });
    }
  });
}
