'use strict';

const TYPE = 'google';
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

    commons.getOAuthConfiguration(TYPE).then(oauth => {

      passport.use(STRATEGY_NAME, new GoogleStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        callbackURL: commons.getCallbackEndpoint(TYPE),
        passReqToCallback: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
