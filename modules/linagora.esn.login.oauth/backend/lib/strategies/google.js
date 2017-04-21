'use strict';

const TYPE = 'google';
const q = require('q');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const STRATEGY_NAME = 'google-login';

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure,
    name: STRATEGY_NAME
  };

  function configure(callback) {

    logger.info('Configuring Google OAuth login');

    q.spread([commons.getCallbackEndpoint(TYPE), commons.getOAuthConfiguration(TYPE)], (url, oauth) => {
      passport.use(STRATEGY_NAME, new GoogleStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        callbackURL: url,
        passReqToCallback: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
