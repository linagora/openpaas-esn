'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var passport = require('passport');
var refresh = require('passport-oauth2-refresh');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(dependencies) {

  var config = dependencies('esn-config');
  var logger = dependencies('logger');
  var helper = require('./helper')(dependencies);

  function configure(callback) {
    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

      if (err) {
        logger.err('Error while getting oauth configuration');
        return callback(err);
      }

      if (!oauth || !oauth.google || !oauth.google.client_id || !oauth.google.client_secret) {
        return callback(new Error('Google OAuth is not configured'));
      }
      var strategy = new GoogleStrategy({
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

          var account = {
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

          helper.upsertAccount(req.user, account, function(err, result) {
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
      passport.use('google-authz', strategy);
      refresh.use('google-authz', strategy);

      callback();
    });
  }

  return {
    configure: configure
  };
};

