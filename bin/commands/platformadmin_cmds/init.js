const q = require('q');
const commons = require('../../commons');
const db = require('../../../fixtures/db');

module.exports = {
  command: 'init',
  desc: 'Initialize the first platformadmin',
  builder: {
    email: {
      describe: 'Email of the user to make as platformadmin',
      demand: true
    },
    force: {
      alias: 'f',
      describe: 'Force to set platformadmin',
      type: 'boolean'
    }
  },
  handler: argv => {
    const { email, force } = argv;

    exec(email, force)
      .then(() => commons.logInfo('Created platformadmin'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(email, force) {
  return db.connect(commons.getDBOptions())
    .then(() => commons.loadMongooseModels())
    .then(() => setPlatformAdminByEmail(email, force))
    .finally(db.disconnect);
}

function setPlatformAdminByEmail(email, force) {
  const corePlatformAdmin = require('../../../backend/core/platformadmin');
  const userCore = require('../../../backend/core/user');

  const findUserByEmail = q.denodeify(userCore.findByEmail);
  const verify = force ?
    () => q(true) :
    () => corePlatformAdmin.getAllPlatformAdmins().then(platformadmins => platformadmins.length === 0);

  return verify().then(isAllowed => {
    if (isAllowed) {
      return findUserByEmail(email)
        .then(user => {
          if (user) {
            return corePlatformAdmin.setPlatformAdmins([user.id]);
          }

          return q.reject(new Error(`No such user with email ${email}`));
        });
    }

    return q.reject(new Error('There is already platformadmin in the system, use --force to overwrite'));
  });
}
