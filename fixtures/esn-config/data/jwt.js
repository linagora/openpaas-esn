'use strict';

module.exports = function() {

  var publicKey = process.env.JWT_PUBLIC || '-----BEGIN PUBLIC KEY-----\ncheckthedoc\n-----END PUBLIC KEY-----';
  var privateKey = process.env.JWT_PRIVATE || '-----BEGIN RSA PRIVATE KEY-----\ncheckthedoc\n-----END RSA PRIVATE KEY-----';

  return {
    algorithm: 'RS256',
    publicKey: publicKey,
    privateKey: privateKey
  };
};
