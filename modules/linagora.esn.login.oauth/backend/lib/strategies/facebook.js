'use strict';

const q = require('q');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const TYPE = 'facebook';
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

    q.spread([commons.getCallbackEndpoint(TYPE), commons.getOAuthConfiguration(TYPE)], (url, oauth) => {

      passport.use(STRATEGY_NAME, new FacebookStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        callbackURL: url,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)', 'displayName', 'location']
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
