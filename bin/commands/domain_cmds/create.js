'use strict';

const commons = require('../../commons');
const CONSTANTS = require('../../constants').params;
const db = require('../../../fixtures/db');
const populate = require('../../../fixtures/populate');

function exec(host, port, database, adminEmail, adminPassword) {
  return db.connect(commons.getDBOptions(host, port, database))
    .then(() => createDomain(adminEmail, adminPassword))
    .finally(db.disconnect);
}

function createDomain(adminEmail, adminPassword) {
  return populate.provisionDomainAndAdministrator(adminEmail, adminPassword);
}

module.exports = {
  command: 'create',
  desc: 'create a new domain',
  builder: {
    email: CONSTANTS.administrator.email,
    password: CONSTANTS.administrator.password
  },
  handler: argv => {
    const { host, port, database, email, password } = argv;

    exec(host, port, database, email, password)
      .then(() => commons.logInfo('Created new domain'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};
