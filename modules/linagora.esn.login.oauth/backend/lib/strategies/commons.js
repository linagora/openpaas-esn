'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var q = require('q');

module.exports = function(dependencies) {

  var userModule = dependencies('user');
  var config = dependencies('esn-config');
  var logger = dependencies('logger');
  var oauthHelpers = dependencies('oauth').helpers;
  var provisionUser = require('../provision')(dependencies);

  return {
    getOAuthConfiguration,
    getCallbackEndpoint,
    handleResponse
  };

  function getOAuthConfiguration(type) {
    return q.ninvoke(config(OAUTH_CONFIG_KEY), 'get').then(function(oauth) {
      if (!oauth || !oauth[type] || !oauth[type].client_id || !oauth[type].client_secret) {
        return q.reject(new Error(type + ' OAuth is not configured correctly'));
      }
      return oauth[type];
    });
  }

  function getCallbackEndpoint(type) {
    return `/login-oauth/${type}/auth/callback`;
  }

  function handleResponse(type) {
    return function(req, accessToken, refreshToken, profile, callback) {
      logger.debug('Handling oauth on provider %s for profile', type, profile);

      if (!req.user) {
        userModule.find({
          'accounts.type': 'oauth',
          'accounts.data.provider': type,
          'accounts.data.id': profile.id
        }, function(err, user) {
          if (err) {
            return callback(err);
          }

          if (user) {
            logger.info('User found from oauth information', user);
            req.user = user;
            return callback(null, user);
          }

          if (!profile.emails || !profile.emails.length) {
            return callback(new Error('Can not provision user account without email'));
          }

          userModule.findByEmail(profile.emails[0].value, function(err, userByEmail) {
            if (err) {
              logger.error('Error while searching user from email', err);
              return callback(err);
            }

            var account = oauthHelpers.profileAsAccount(profile, type, accessToken, refreshToken);

            if (userByEmail) {
              return q.denodeify(oauthHelpers.upsertUserAccount)(userByEmail, account).then(function(res) {
                logger.info('Account has been updated with new information', res);
                req.user = res.user;
                callback(null, req.user);
              }, callback);
            }

            provisionUser.provision(profile, account).then(function(provisioned) {
              req.user = provisioned;
              callback(null, provisioned);
            }, function(err) {
              logger.error('Can not provision user from %s provider', type, err);
              callback(err);
            });
          });
        });
      } else {
        callback(null, req.user);
      }
    };
  }
};
