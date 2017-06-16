'use strict';

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const { OAUTH_CONFIG_KEY } = require('../constants');

module.exports = function(dependencies) {

  const config = dependencies('esn-config');
  const logger = dependencies('logger');
  const helper = dependencies('oauth').helpers;
  const STRATEGY_NAME = 'facebook-authz';

  return {
    configure
  };

  function configure(callback) {
    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

      if (err) {
        logger.err('Error while getting oauth configuration');

        return callback(err);
      }

      if (!oauth || !oauth.facebook || !oauth.facebook.client_id || !oauth.facebook.client_secret) {
        passport.unuse(STRATEGY_NAME);

        return callback(new Error('Facebook OAuth is not configured'));
      }

      passport.use(STRATEGY_NAME, new FacebookStrategy({
          clientID: oauth.facebook.client_id,
          clientSecret: oauth.facebook.client_secret,
          callbackURL: '/oauth/facebook/connect/callback',
          passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, callback) {

          if (!req.user) {
            logger.error('Not Logged in');

            return callback(new Error('Can not authorize facebook without being logged in'));
          }

          const account = {
            type: 'oauth',
            data: {
              provider: 'facebook',
              id: profile.id,
              username: profile.username,
              display_name: profile.displayName,
              token: accessToken,
              refresh_token: refreshToken
            }
          };

          helper.upsertUserAccount(req.user, account, function(err, result) {
            if (err) {
              logger.error('Can not add facebook account to user', err);

              return callback(err);
            }
            req.oauth = {
              status: result.status
            };
            req.user = result.user;

            return callback(null, req.user);
          });
        }));

      callback();
    });
  }
};
