'use strict';

var q = require('q');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var OAUTH_CONFIG_KEY = 'oauth';
var TYPE = 'twitter';

module.exports = function(dependencies) {

  var config = dependencies('esn-config');
  var logger = dependencies('logger');
  var commons = require('./commons')(dependencies);

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

    q.spread([commons.getCallbackEndpoint(TYPE), getTwitterConfiguration()], function(url, oauth) {

      passport.use('twitter-login', new TwitterStrategy({
        consumerKey: oauth.consumer_key,
        consumerSecret: oauth.consumer_secret,
        passReqToCallback: true,
        callbackURL: url,
        includeEmail: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }

  return {
    configure: configure
  };
};
