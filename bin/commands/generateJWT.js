'use strict';

const path = require('path');
const ursa = require('ursa');
const { promisify } = require('util');
const fsCreateFileFromString = promisify(require('fs-extra').outputFile);
const fsChmod = promisify(require('fs').chmod);
const CONSTANTS = require('../constants').params;
const commons = require('../commons');
const db = require('../../fixtures/db');
const { 'esn-config': esnConfig, logger } = require('../../backend/core/');
const JWT_PUBLIC_KEY_FILE_NAME = 'jwt_publickey';
const JWT_ALGORITHM = 'RS256';

const exec = keyPath => {
  return db.connect(commons.getDBOptions())
    .then(_generateJWT)
    .then(_storeJwtKeys)
    .then(keys => _saveFile(keys, keyPath))
    .then(db.disconnect)
    .catch(err => logger.error('Error when generating jwt keys', err));
};

const command = {
  command: 'generateJWT',
  desc: 'Generate a keys pairs for JWT',
  builder: {
    path: CONSTANTS.jwt.path
  },
  handler: argv => {
    const { path } = argv;

    exec(path)
      .then(() => commons.logInfo('Generated'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function _generateJWT() {
  const key = ursa.generatePrivateKey();
  const privateKey = key.toPrivatePem().toString('ascii');
  const publicKey = key.toPublicPem().toString('ascii');

  return {
    algorithm: JWT_ALGORITHM,
    publicKey: publicKey,
    privateKey: privateKey
  };
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
