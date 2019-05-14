'use strict';

const crypto = require('crypto');

var jwt = require('jsonwebtoken');
var esnConfig = require('../esn-config');

var PRIVATE_KEY = 'privateKey',
    PUBLIC_KEY = 'publicKey',
    ALGORITHM = 'algorithm';

function WebTokenConfig(config) {
  if (!config[PRIVATE_KEY]) { throw new Error(PRIVATE_KEY + ' is missing in the jwt configuration'); }
  if (!config[PUBLIC_KEY]) { throw new Error(PUBLIC_KEY + ' is missing in the jwt configuration'); }
  if (!config[ALGORITHM]) { throw new Error(ALGORITHM + ' is missing in the jwt configuration'); }

  this.privateKey = config[PRIVATE_KEY];
  this.publicKey = config[PUBLIC_KEY];
  this.algorithm = config[ALGORITHM];
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

function generateWebToken(payload, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  if (!payload) {
    return callback(new Error('Payload is required to generated a JWT.'));
  }

  getWebTokenConfig((err, config) => {
    if (err) {
      return callback(err);
    }

    const signOptions = Object.assign({ algorithm: config.algorithm }, options);

    jwt.sign(payload, config.privateKey, signOptions, callback);
  });
}

function generateKeyPair(callback) {
  crypto.generateKeyPair(
    'rsa',
    {
      modulusLength: 2048,
      publicKeyEncoding: {
        format: 'pem',
        type: 'pkcs1'
      },
      privateKeyEncoding: {
        format: 'pem',
        type: 'pkcs1'
      }
    },
    (err, publicKey, privateKey) => {
      if (err) {
        callback(err);
      } else {
        callback(null, {privateKey, publicKey});
      }
    }
  );
}

module.exports = {
  WebTokenConfig,
  getWebTokenConfig,
  generateWebToken,
  generateKeyPair
};
