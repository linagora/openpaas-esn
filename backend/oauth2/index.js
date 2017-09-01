'use strict';

var oauth2orize = require('oauth2orize'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    randomstring = require('randomstring'),
    logger = require('../core/logger'),
    OAuthAuthorizationCode = mongoose.model('OAuthAuthorizationCode'),
    OAuthAccessToken = mongoose.model('OAuthAccessToken'),
    OAuthClient = mongoose.model('OAuthClient');

const assetRegistry = require('../core').assets;

var server = oauth2orize.createServer();

server.serializeClient(function(client, done) {
  var clientId = client._id || client;
  return done(null, clientId);
});

server.deserializeClient(function(id, done) {
  OAuthClient.findById(id, function(error, client) {
    if (error) {
      return done(error);
    }
    return done(null, client);
  });
});

server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, done) {
  var userId = user._id || user;

  if (!userId || !client.creator || String(userId) !== String(client.creator)) {
    return done(null, false);
  }

  var clientId = client._id || client;
  var code = randomstring.generate(16);
  var oauthAuthorizationCode = new OAuthAuthorizationCode({
    code: code,
    redirectUri: redirectUri,
    userId: userId,
    clientId: clientId
  });
  logger.debug('OAuth: grant authorizationcode: clientId', clientId, 'userId', userId, 'redirectUri', redirectUri);
  oauthAuthorizationCode.save(function(error) {
    if (error) {
      return done(error);
    }
    return done(null, code);
  });
}));

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
  var userId = user._id || user;

  if (!userId || !client.creator || String(userId) !== String(client.creator)) {
    return done(null, false);
  }

  var token = randomstring.generate(40);
  var clientId = client._id || client;
  var oauthAccessToken = new OAuthAccessToken({
    accessToken: token,
    clientId: clientId,
    userId: userId
  });
  logger.debug('OAuth: grant access token: clientId', clientId, 'userId', userId);
  oauthAccessToken.save(function(error) {
    return done(error, !error && token);
  });
}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, done) {
  var clientId = client._id || client;
  logger.debug('OAuth: exchange: clientId', clientId, 'code', code, 'redirectUri', redirectUri);
  OAuthAuthorizationCode.findOne({ clientId: clientId, code: code, redirectUri: redirectUri }, function(error, oauthauthorizationcode) {
    if (error) {
      return done(error);
    }
    if (!oauthauthorizationcode) {
      return done(null, false);
    }

    var uid = randomstring.generate(40);
    var oauthAccessToken = new OAuthAccessToken({
      accessToken: uid,
      clientId: clientId,
      userId: oauthauthorizationcode.userId
    });
    oauthAccessToken.save(function(error) {
      if (error) {
        return done(error);
      }
      return done(null, uid);
    });
  });
}));

exports.authorization = server.authorization(function(clientId, redirectUri, done) {
  logger.debug('OAuth: authorization: clientId', clientId, 'redirectUri', redirectUri);
  OAuthClient.findOne({ clientId: clientId }, function(error, client) {
    if (error) {
      return done(error);
    }
    return done(null, client, redirectUri);
  });
});

exports.dialog = function(req, res) {
  // if current user is exactly app owner, send an approval dialog to obtain permission
  if (req.user._id.toString() === req.oauth2.client.creator.toString()) {
    res.locals.assets = assetRegistry.envAwareApp('oauth');
    res.render('oauth/index', {
      transactionId: req.oauth2.transactionID,
      user: req.user,
      client: req.oauth2.client
    });
  } else {
    // if current user is not app owner:
    // remove generated transaction from the session
    // and redirect to redirectURI with error=access_denied
    // more detail about OAuth error response: https://tools.ietf.org/html/rfc6749#section-4.1.2.1
    if (req.session && req.session.authorize) {
      delete req.session.authorize[req.oauth2.transactionID];
    }

    res.redirect(`${req.oauth2.redirectURI}?error=access_denied`);
  }
};

exports.decision = server.decision();

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
];

exports.oauthserver = server;
