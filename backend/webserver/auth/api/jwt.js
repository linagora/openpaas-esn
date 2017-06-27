'use strict';

const userModule = require('../../../core/user'),
      JwtStrategy = require('passport-jwt').Strategy;

module.exports = {
  name: 'jwt',
  strategy: new JwtStrategy(require('../jwt-noauth').optionsResolver, (jwt, done) => {
    if (!jwt.sub) {
      return done(null, false, { message: 'sub is required in the JWT payload' });
    }

    userModule.findByEmail(jwt.sub, (err, user) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    });
  })
};
