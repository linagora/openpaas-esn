'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

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

      if (!oauth || !oauth.facebook || !oauth.facebook.client_id || !oauth.facebook.client_secret) {
        return callback(new Error('Facebook OAuth is not configured'));
      }

      passport.use('facebook-authz', new FacebookStrategy({
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

          var account = {
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

  return {
    configure: configure
  };
};
