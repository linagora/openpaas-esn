'use strict';

const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const { OAUTH_CONFIG_KEY } = require('../constants');

module.exports = function(dependencies) {

  const config = dependencies('esn-config');
  const logger = dependencies('logger');
  const helper = dependencies('oauth').helpers;
  const STRATEGY_NAME = 'twitter-authz';

  return {
    configure
  };

  function configure(callback) {
    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

      if (err) {
        logger.err('Error while getting oauth configuration');

        return callback(err);
      }

      if (!oauth || !oauth.twitter || !oauth.twitter.consumer_key || !oauth.twitter.consumer_secret) {
        passport.unuse(STRATEGY_NAME);

        return callback(new Error('Twitter OAuth is not configured'));
      }

      passport.use(STRATEGY_NAME, new TwitterStrategy({
          consumerKey: oauth.twitter.consumer_key,
          consumerSecret: oauth.twitter.consumer_secret,
          passReqToCallback: true
        },
        function(req, token, tokenSecret, profile, callback) {

          if (!req.user) {
            logger.error('Not Logged in');

            return callback(new Error('Can not authorize twitter without being logged in'));
          }

          const account = {
            type: 'oauth',
            data: {
              provider: 'twitter',
              id: profile.id,
              username: profile.username,
              display_name: profile.displayName,
              token: token,
              token_secret: tokenSecret
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
        }));

      callback();
    });
  }
};
