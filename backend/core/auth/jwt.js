'use strict';

var ursa = require('ursa');
var jwt = require('jsonwebtoken');
var esnConfig = require('../esn-config');

var PRIVATE_KEY = 'privateKey',
    PUBLIC_KEY = 'publicKey',
    ALGORITHM = 'algorithm',
    EXPIRESIN = 'expiresIn';

var DEFAULT_EXPIRESIN = '2 days';

function WebTokenConfig(config) {
  if (!config[PRIVATE_KEY]) { throw new Error(PRIVATE_KEY + ' is missing in the jwt configuration'); }
  if (!config[PUBLIC_KEY]) { throw new Error(PUBLIC_KEY + ' is missing in the jwt configuration'); }
  if (!config[ALGORITHM]) { throw new Error(ALGORITHM + ' is missing in the jwt configuration'); }

  this.privateKey = config[PRIVATE_KEY];
  this.publicKey = config[PUBLIC_KEY];
  this.algorithm = config[ALGORITHM];
  this.expiresIn = config[EXPIRESIN] || DEFAULT_EXPIRESIN;
}

function getWebTokenConfig(callback) {
  esnConfig('jwt').get(function(err, config) {
    if (err) {
      return callback(err);
    }
    if (!config) {
      return callback(new Error('No "jwt" configuration has been found'));
    }

    return callback(null, new WebTokenConfig(config));
  });
}

function generateWebToken(payload, callback) {
  if (!payload) {
    return callback(new Error('Payload is required to generated a JWT.'));
  }
  getWebTokenConfig(function(err, config) {
    if (err) {
      return callback(err);
    }
    jwt.sign(payload, config.privateKey, {algorithm: config.algorithm}, function(err, token) {
      return callback(err, token);
    });
  });
}

function generateKeyPair(callback) {
  try {
    var key = ursa.generatePrivateKey();
    var privateKey = key.toPrivatePem().toString('ascii');
    var publicKey = key.toPublicPem().toString('ascii');

    return callback(null, {
      privateKey,
      publicKey
    });
  } catch (err) {
    return callback(err);
  }

}

module.exports = {
  WebTokenConfig,
  getWebTokenConfig,
  generateWebToken,
  generateKeyPair
};
