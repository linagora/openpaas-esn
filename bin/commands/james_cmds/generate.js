const commons = require('../../commons');
const db = require('../../../fixtures/db');
const corewAuthJwt = require('../../../backend/core/auth/jwt');
const { promisify } = require('util');

module.exports = {
  command: 'generate-token',
    desc: 'Generate James token',
    builder: {
      type: {
        describe: 'Type of JWT token',
        choices: ['webAdmin', 'jmap'],
        demand: true
      },
      email: {
        describe: 'User email to generate JWT token for JMAP request'
      }
    },
    handler: argv => {
      const { type, email } = argv;

      exec({ type, email })
        .catch(commons.logError)
        .finally(commons.exit);
    }
};

function exec({ type, email } = {}) {
  return db.connect(commons.getDBOptions())
    .then(() => {
      if (type === 'webAdmin') {
        return generateToken({
          sub: 'esn',
          admin: true
        });
      }

      if (!email) {
        commons.logError('User email is required when generating JWT token for JMAP requests');
        commons.exit();
      }

      return generateToken({ sub: email });
    })
    .then(token => commons.logInfo(`Generated token: ${token}`))
    .then(db.disconnect);
}

function generateToken(payload) {
  return promisify(corewAuthJwt.generateWebToken)(payload);
}
