'use strict';

const passport = require('passport');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const TYPE = 'google';
const STRATEGY_NAME = 'google-token-login';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure,
    name: STRATEGY_NAME
  };

  ////////////

  function configure(callback) {

    logger.info('Configuring Google Token OAuth login');

    commons.getOAuthConfiguration(TYPE).then(oauth => {
      passport.use(STRATEGY_NAME, new GoogleTokenStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        passReqToCallback: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
