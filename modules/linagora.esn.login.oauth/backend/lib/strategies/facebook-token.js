'use strict';

const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const TYPE = 'facebook';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure
  };

  ////////////

  function configure(callback) {
    logger.info('Configuring Facebook Token OAuth login');

    commons.getOAuthConfiguration(TYPE).then(oauth => {
      passport.use('facebook-token-login', new FacebookTokenStrategy({
        clientID: oauth.client_id,
        clientSecret: oauth.client_secret,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)', 'displayName', 'bio', 'location']
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
