'use strict';

const commons = require('../commons');
const CONSTANTS = require('../constants').params;
const configFixture = require('../../fixtures/esn-config');
const db = require('../../fixtures/db');
const command = {
  command: 'configure',
  desc: 'Configure OpenPaaS',
  builder: {
    host: CONSTANTS.mongodb.host,
    port: CONSTANTS.mongodb.port,
    database: CONSTANTS.mongodb.database
  },
  handler: argv => {
    const { host, port, database } = argv;

    exec(host, port, database)
      .then(() => commons.logInfo('Configured'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, dbName) {
  return db.connect(commons.getDBOptions(host, port, dbName))
    .then(configFixture)
    .then(db.disconnect);
}

module.exports = {
  exec,
  command
};
