'use strict';

var OAuthClient = require('mongoose').model('OAuthClient'),
    ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

module.exports = {
  name: 'oauth2-client-password',
  strategy: new ClientPasswordStrategy(function(clientId, clientSecret, done) {
    OAuthClient.findOne({clientId: clientId}, function(err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      if(client.clientSecret !== clientSecret) {
        return done(null, false);
      }
      return done(null, client);
    });
  })
};
