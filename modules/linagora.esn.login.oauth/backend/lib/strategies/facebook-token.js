'use strict';

const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const TYPE = 'facebook';
const STRATEGY_NAME = 'facebook-token-login';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure,
    name: STRATEGY_NAME
  };

  ////////////

  function configure(callback) {
    logger.info('Configuring Facebook Token OAuth login');

    commons.getOAuthConfiguration(TYPE).then(oauth => {
      passport.use(STRATEGY_NAME, new FacebookTokenStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)', 'displayName', 'location']
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
