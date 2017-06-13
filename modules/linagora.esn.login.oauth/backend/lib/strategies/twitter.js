'use strict';

const q = require('q');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const OAUTH_CONFIG_KEY = 'oauth';
const TYPE = 'twitter';
const STRATEGY_NAME = 'twitter-login';

module.exports = function(dependencies) {

  const config = dependencies('esn-config');
  const logger = dependencies('logger');
  const commons = require('./commons')(dependencies);

  return {
    configure: configure,
    name: STRATEGY_NAME
  };

  function getTwitterConfiguration() {
    const defer = q.defer();

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

    getTwitterConfiguration().then(oauth => {

      passport.use(STRATEGY_NAME, new TwitterStrategy({
        consumerKey: oauth.consumer_key,
        consumerSecret: oauth.consumer_secret,
        passReqToCallback: true,
        callbackURL: commons.getCallbackEndpoint(TYPE),
        includeEmail: true
      }, commons.handleResponse(TYPE)));
      callback();
    }, callback);
  }
};
