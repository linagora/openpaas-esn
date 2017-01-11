'use strict';

const commons = require('../commons');
const configFixture = require('../../fixtures/esn-config');
const db = require('../../fixtures/db');
const command = {
  command: 'configure',
  desc: 'Configure OpenPaaS',
  builder: {},
  handler: () => {
    exec()
      .then(() => commons.logInfo('Configured'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec() {
  return db.connect(commons.getDBOptions())
    .then(configFixture)
    .then(db.disconnect);
}

module.exports = {
  exec,
  command
};
