'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

module.exports = function(dependencies) {

  var config = dependencies('esn-config');
  var logger = dependencies('logger');
  var helper = dependencies('oauth').helpers;

  function configure(callback) {
    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

      if (err) {
        logger.err('Error while getting oauth configuration');
        return callback(err);
      }

      if (!oauth || !oauth.twitter || !oauth.twitter.consumer_key || !oauth.twitter.consumer_secret) {
        return callback(new Error('Twitter OAuth is not configured'));
      }

      passport.use('twitter-authz', new TwitterStrategy({
          consumerKey: oauth.twitter.consumer_key,
          consumerSecret: oauth.twitter.consumer_secret,
          passReqToCallback: true
        },
        function(req, token, tokenSecret, profile, callback) {

          if (!req.user) {
            logger.error('Not Logged in');
            return callback(new Error('Can not authorize twitter without being logged in'));
          }

          var account = {
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

  return {
    configure: configure
  };
};
