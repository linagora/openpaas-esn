'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var q = require('q');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function(dependencies) {

  var config = dependencies('esn-config');
  var logger = dependencies('logger');
  var user = dependencies('user');
  var helpers = dependencies('helpers');

  function getCallbackEndpoint() {
    var defer = q.defer();
    helpers.config.getBaseUrl(function(err, baseURL) {
      if (err) {
        return defer.reject(err);
      }

      if (!baseURL) {
        return defer.reject(new Error('Can not retrieve baseURL'));
      }

      defer.resolve(baseURL + '/login-oauth/facebook/auth/callback');
    });
    return defer.promise;
  }

  function getFacebookConfiguration() {
    var defer = q.defer();

    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {
      if (err) {
        return defer.reject(err);
      }

      if (!oauth || !oauth.facebook || !oauth.facebook.client_id || !oauth.facebook.client_secret) {
        return defer.reject(new Error('Facebook OAuth is not configured'));
      }
      return defer.resolve(oauth.facebook);
    });
    return defer.promise;
  }

  function configure(callback) {

    logger.info('Configuring Facebook OAuth login');

    q.spread([getCallbackEndpoint(), getFacebookConfiguration()], function(url, oauth) {

      passport.use('facebook-login', new FacebookStrategy({
          clientID: oauth.client_id,
          clientSecret: oauth.client_secret,
          callbackURL: url,
          passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, callback) {

          if (!req.user) {
            return user.find({'accounts.type': 'oauth', 'accounts.data.provider': 'facebook', 'accounts.data.id': profile.id}, function(err, user) {
              if (err) {
                return callback(err);
              }

              if (user) {
                req.user = user;
                return callback(null, user);
              }

              callback();
            });
          }
        }));
      callback();
    }, callback);
  }

  return {
    configure: configure
  };
};
