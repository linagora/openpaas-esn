'use strict';

var q = require('q');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TYPE = 'facebook';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var commons = require('./commons')(dependencies);

  function configure(callback) {

    logger.info('Configuring Facebook OAuth login');

    q.spread([commons.getCallbackEndpoint(TYPE), commons.getOAuthConfiguration(TYPE)], function(url, oauth) {
      passport.use('facebook-login', new FacebookStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        callbackURL: url,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name']
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }

  return {
    configure: configure
  };
};
