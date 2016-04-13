'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var q = require('q');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

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

      defer.resolve(baseURL + '/login-oauth/twitter/auth/callback');
    });
    return defer.promise;
  }

  function getTwitterConfiguration() {
    var defer = q.defer();

    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {
      if (err) {
        return defer.reject(err);
      }

      if (!oauth || !oauth.twitter || !oauth.twitter.consumer_key || !oauth.twitter.consumer_secret) {
        return defer.reject(new Error('Twitter OAuth is not configured'));
      }
      return defer.resolve(oauth.twitter);
    });
    return defer.promise;
  }

  function configure(callback) {

    logger.info('Configuring Twitter OAuth login');

    q.spread([getCallbackEndpoint(), getTwitterConfiguration()], function(url, oauth) {

      passport.use('twitter-login', new TwitterStrategy({
          consumerKey: oauth.consumer_key,
          consumerSecret: oauth.consumer_secret,
          passReqToCallback: true,
          callbackURL: url
        },
        function(req, accessToken, tokenSecret, profile, callback) {

          if (!req.user) {
            return user.find({'accounts.type': 'oauth', 'accounts.data.provider': 'twitter', 'accounts.data.id': profile.id}, function(err, user) {
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
