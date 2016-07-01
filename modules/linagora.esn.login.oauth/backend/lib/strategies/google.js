'use strict';

var TYPE = 'google';
var q = require('q');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var commons = require('./commons')(dependencies);

  function configure(callback) {

    logger.info('Configuring Google OAuth login');

    q.spread([commons.getCallbackEndpoint(TYPE), commons.getOAuthConfiguration(TYPE)], function(url, oauth) {
      passport.use('google-login', new GoogleStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        callbackURL: url,
        passReqToCallback: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }

  return {
    configure: configure
  };
};
