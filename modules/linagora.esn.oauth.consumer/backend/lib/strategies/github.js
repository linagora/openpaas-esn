'use strict';

const SCOPE = ['user:email', 'notifications'];
const passport = require('passport');
const GithubStrategy = require('passport-github').Strategy;
const { OAUTH_CONFIG_KEY } = require('../constants');

module.exports = dependencies => {

  const config = dependencies('esn-config');
  const logger = dependencies('logger');
  const helper = dependencies('oauth').helpers;
  const STRATEGY_NAME = 'github-authz';

  return {
    configure
  };

  function configure(callback) {
    config(OAUTH_CONFIG_KEY).get((err, oauth) => {
      if (err) {
        logger.err('Error while getting oauth configuration');

        return callback(err);
      }

      if (!oauth || !oauth.github || !oauth.github.client_id || !oauth.github.client_secret) {
        passport.unuse(STRATEGY_NAME);

        return callback(new Error('Github OAuth is not configured'));
      }

      passport.use(STRATEGY_NAME, new GithubStrategy({
          clientID: oauth.github.client_id,
          clientSecret: oauth.github.client_secret,
          callbackURL: '/oauth/github/connect/callback',
          scope: SCOPE,
          userAgent: 'OpenPaaS',
          passReqToCallback: true
        }, (req, accessToken, refreshToken, profile, callback) => {
          if (!req.user) {
            logger.error('Not Logged in');

            return callback(new Error('Can not authorize github without being logged in'));
          }

          const account = {
            type: 'oauth',
            data: {
              provider: 'github',
              id: profile.id,
              username: profile.username,
              display_name: profile.displayName,
              token: accessToken,
              refresh_token: refreshToken
            }
          };

          helper.upsertUserAccount(req.user, account, (err, result) => {
            if (err) {
              logger.error('Can not add github account to user', err);

              return callback(err);
            }

            req.oauth = {
              status: result.status
            };
            req.user = result.user;

            callback(null, req.user);
          });
        }));

      callback();
    });
  }
};
