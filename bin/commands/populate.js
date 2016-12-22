'use strict';

const commons = require('../commons');
const CONSTANTS = require('../constants').params;
const populateFixture = require('../../fixtures/populate');
const db = require('../../fixtures/db');
const command = {
  command: 'populate',
  desc: 'Populate OpenPaaS Resources',
  builder: {
    host: CONSTANTS.mongodb.host,
    port: CONSTANTS.mongodb.port,
    database: CONSTANTS.mongodb.database
  },
  handler: argv => {
    const { host, port, database } = argv;

    exec(host, port, database)
      .then(() => commons.logInfo('Populated'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, dbName) {
  return db.connect(commons.getDBOptions(host, port, dbName))
    .then(populateFixture.populateAll)
    .then(db.disconnect);
}

module.exports = {
  exec,
  command
};
