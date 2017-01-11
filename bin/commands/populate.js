'use strict';

const commons = require('../commons');
const populateFixture = require('../../fixtures/populate');
const db = require('../../fixtures/db');
const command = {
  command: 'populate',
  desc: 'Populate OpenPaaS Resources',
  builder: {},
  handler: () => {
    exec()
      .then(() => commons.logInfo('Populated'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec() {
  return db.connect(commons.getDBOptions())
    .then(populateFixture.populateAll)
    .then(db.disconnect);
}

module.exports = {
  exec,
  command
};
