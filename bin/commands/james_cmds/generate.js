const commons = require('../../commons');
const db = require('../../../fixtures/db');
const corewAuthJwt = require('../../../backend/core/auth/jwt');
const { promisify } = require('util');

module.exports = {
  command: 'generate-token',
    desc: 'Generate James admin token',
    handler: () => {
      exec()
        .catch(commons.logError)
        .finally(commons.exit);
    }
};

function exec() {
  return db.connect(commons.getDBOptions())
    .then(generateToken)
    .then(token => commons.logInfo(`Generated token: ${token}`))
    .then(db.disconnect);
}

function generateToken() {
  const payload = {
    sub: 'esn',
    admin: true
  };

  return promisify(corewAuthJwt.generateWebToken)(payload);
}
