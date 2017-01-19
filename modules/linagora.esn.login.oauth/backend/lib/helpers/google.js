'use strict';

const request = require('request');
const q = require('q');
const TYPE = 'google';

module.exports = function(dependencies) {
  const commons = require('./../strategies/commons')(dependencies);

  return {
    getAccessToken
  };

  ////////////

  function getAccessToken(serverAuthCode) {
    const defer = q.defer();

    commons.getOAuthConfiguration(TYPE).then(oauth => {
      request({
        uri: 'https://www.googleapis.com/oauth2/v4/token',
        method: 'POST',
        qs: {
          client_id: oauth.client_id,
          client_secret: oauth.client_secret,
          code: serverAuthCode,
          grant_type: 'authorization_code'
        }
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          return defer.resolve(JSON.parse(body).access_token);
        }

        return defer.reject(new Error('Can not get Google access token'));
      });
    }, () => defer.reject(new Error('OAuth is not configured correctly')));

    return defer.promise;
  }
};
