'use strict';

const commons = require('../../commons');
const CONSTANTS = require('../../constants').params;
const db = require('../../../fixtures/db');
const populate = require('../../../fixtures/populate');

function exec(adminEmail, adminPassword, ignoreConfiguration) {
  return db.connect(commons.getDBOptions())
    .then(() => createDomain(adminEmail, adminPassword, ignoreConfiguration))
    .finally(db.disconnect);
}

function createDomain(adminEmail, adminPassword, ignoreConfiguration) {
  return populate.provisionDomainAndAdministrator(adminEmail, adminPassword)
    .then(([admin, domain]) => {
      if (ignoreConfiguration) {
        return Promise.resolve();
      }

      return populate.populateDomainConfigurationAndTechnicalUsers(null, admin, domain);
    });
}

module.exports = {
  command: 'create',
  desc: 'create a new domain',
  builder: {
    email: CONSTANTS.administrator.email,
    password: CONSTANTS.administrator.password,
    'ignore-configuration': {
      describe: 'Do not create domain-level configuration',
      type: 'boolean',
      default: false
    }
  },
  handler: argv => {
    const { email, password, ignoreConfiguration } = argv;

    exec(email, password, ignoreConfiguration)
      .then(() => commons.logInfo('Created new domain'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};
