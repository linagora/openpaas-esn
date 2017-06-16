'use strict';

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const TYPE = 'facebook';
const FACEBOOK_PROFILE_FIELDS = ['id', 'emails', 'name', 'picture.type(large)', 'displayName', 'location'];
const STRATEGY_NAME = 'facebook-login';

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure,
    name: STRATEGY_NAME
  };

  function configure(callback) {

    logger.info('Configuring Facebook OAuth login');

    commons.getOAuthConfiguration(TYPE).then(oauth => {

      passport.use(STRATEGY_NAME, new FacebookStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        callbackURL: commons.getCallbackEndpoint(TYPE),
        passReqToCallback: true,
        profileFields: FACEBOOK_PROFILE_FIELDS
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
