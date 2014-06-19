'use strict';

var BearerStrategy = require('passport-http-bearer').Strategy;
var oauth = require('../../core/auth/oauth');

module.exports = {
  name: 'bearer',
  strategy: new BearerStrategy(function(token, done) {
    oauth.findUserByToken(token, function(err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    });
  })
};
