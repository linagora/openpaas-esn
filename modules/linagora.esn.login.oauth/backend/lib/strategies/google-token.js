'use strict';

const passport = require('passport');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const TYPE = 'google';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure
  };

  ////////////

  function configure(callback) {

    logger.info('Configuring Google Token OAuth login');

    commons.getOAuthConfiguration(TYPE).then(oauth => {
      passport.use('google-token-login', new GoogleTokenStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        passReqToCallback: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
