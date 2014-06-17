'use strict';

var OAuthClient = require('mongoose').model('OAuthClient'),
    BasicStrategy = require('passport-http').BasicStrategy;

module.exports = {
  name: 'basic',
  strategy: new BasicStrategy(function(clientId, clientSecret, done) {
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
