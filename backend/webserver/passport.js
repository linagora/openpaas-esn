'use strict';

var passport = require('passport');
var config = require('../core').config('default');
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.serializeUser(function(user, done) {
  if (user && user.emails && user.emails.length && user.emails[0]) {
    var email = user.emails[0].value || user.emails[0];
    return done(null, email);
  }
  return done(new Error('Unable to serialize a session without email'));
});

passport.deserializeUser(function(username, done) {
  User.loadFromEmail(username, function(err, user) {
    done(err, user);
  });
});

try {
  passport.use('basic', require('./auth/basic').strategy);
  passport.use('oauth2-client-password', require('./auth/oauth2-client-password').strategy);
} catch (err) {
  console.log('Can not load the client strategies:', err);
}

if (config.auth && config.auth.strategies) {
  config.auth.strategies.forEach(function(auth) {
    try {
      passport.use(auth, require('./auth/' + auth).strategy);
    } catch (err) {
      console.log('Can not load the ' + auth + ' strategy:', err);
    }
  });
}
