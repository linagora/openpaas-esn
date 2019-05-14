'use strict';

const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const fsCreateFileFromString = promisify(require('fs-extra').outputFile);
const fsChmod = promisify(require('fs').chmod);
const CONSTANTS = require('../constants').params;
const commons = require('../commons');
const db = require('../../fixtures/db');
const { 'esn-config': esnConfig } = require('../../backend/core/');
const JWT_PUBLIC_KEY_FILE_NAME = 'jwt_publickey';
const JWT_ALGORITHM = 'RS256';

const exec = keyPath => {
  return _generateJWT()
    .then(_storeJwtKeys)
    .then(keys => _saveFile(keys, keyPath));
};

const command = {
  command: 'generateJWT',
  desc: 'Generate a keys pairs for JWT',
  builder: {
    path: CONSTANTS.jwt.path
  },
  handler: argv => {
    const { path } = argv;

    db.connect(commons.getDBOptions())
      .then(() => exec(path))
      .then(() => commons.logInfo('Generated'))
      .catch(commons.logError)
      .finally(db.disconnect)
      .finally(commons.exit);
  }
};

function _generateJWT() {
  return new Promise((resolve, reject) => {
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
          reject(err);
        } else {
          resolve({
            algorithm: JWT_ALGORITHM,
            publicKey,
            privateKey
          });
        }
      }
    );
  });
}

function _storeJwtKeys(config) {
  return esnConfig('jwt').set(config)
    .then(() => config.publicKey);
}

function _saveFile(publicJwtKey, keyPath) {
  const file = path.resolve(keyPath, JWT_PUBLIC_KEY_FILE_NAME);

  return fsCreateFileFromString(file, publicJwtKey).then(() => fsChmod(file, 600));
}

module.exports = {
  exec,
  command
};
