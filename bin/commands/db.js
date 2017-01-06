'use strict';

const q = require('q');
const dbFixture = require('../../fixtures/config/data/db');
const fs = require('fs');
const path = require('path');
const commons = require('../commons');
const CONSTANTS = require('../constants').params;
const command = {
  command: 'db',
  desc: 'Generate and save db.json configuration file',
  builder: {
    host: CONSTANTS.mongodb.host,
    port: CONSTANTS.mongodb.port,
    database: CONSTANTS.mongodb.database,
    'connection-string': CONSTANTS.mongodb.connectionString
  },
  handler: argv => {
    const { host, port, database, connectionString } = argv;

    exec(host, port, database, connectionString)
      .then(() => commons.logInfo('Saved!'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, dbName, connectionString) {
  const defer = q.defer();
  const file = path.normalize(__dirname + '/../../config/db.json');
  const db = dbFixture(host, port, dbName, connectionString);

  fs.writeFile(file, JSON.stringify(db), function(err) {
    if (err) {
      return defer.reject(err);
    }
    defer.resolve(db);
  });

  return defer.promise;
}

module.exports = {
  exec,
  command
};
