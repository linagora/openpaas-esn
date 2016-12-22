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
    database: CONSTANTS.mongodb.database
  },
  handler: argv => {
    const { host, port, database } = argv;

    exec(host, port, database)
      .then(() => commons.logInfo('Saved!'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, dbName) {
  host = host || 'localhost';
  port = port || 27017;
  dbName = dbName || 'esn';
  var defer = q.defer();
  var db = dbFixture(host, port, dbName);
  var file = path.normalize(__dirname + '/../../config/db.json');

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
