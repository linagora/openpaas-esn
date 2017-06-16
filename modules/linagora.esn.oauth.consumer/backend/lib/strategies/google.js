'use strict';

const passport = require('passport');
const refresh = require('passport-oauth2-refresh');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { OAUTH_CONFIG_KEY } = require('../constants');

module.exports = function(dependencies) {

  const config = dependencies('esn-config');
  const logger = dependencies('logger');
  const helper = dependencies('oauth').helpers;
  const STRATEGY_NAME = 'google-authz';

  return {
    configure
  };

  function configure(callback) {
    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

      if (err) {
        logger.err('Error while getting oauth configuration');

        return callback(err);
      }

      if (!oauth || !oauth.google || !oauth.google.client_id || !oauth.google.client_secret) {
        passport.unuse(STRATEGY_NAME);

        return callback(new Error('Google OAuth is not configured'));
      }

      const strategy = new GoogleStrategy({
          clientID: oauth.google.client_id,
          clientSecret: oauth.google.client_secret,
          callbackURL: '/oauth/google/connect/callback',
          passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, callback) {
          if (!req.user) {
            logger.error('Not Logged in');

            return callback(new Error('Can not authorize without being logged in'));
          }

          const account = {
            type: 'oauth',
            data: {
              provider: 'google',
              id: profile.id,
              username: profile.displayName,
              display_name: profile.displayName,
              token: accessToken,
              refresh_token: refreshToken
            }
          };

          helper.upsertUserAccount(req.user, account, function(err, result) {
            if (err) {
              logger.error('Can not add external account to user', err);

              return callback(err);
            }
            req.oauth = {
              status: result.status
            };
            req.user = result.user;

            return callback(null, req.user);
          });
        });

      passport.use(STRATEGY_NAME, strategy);
      refresh.use(STRATEGY_NAME, strategy);

      callback();
    });
  }
};
