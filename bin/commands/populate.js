'use strict';

var commons = require('../commons');
var populateFixture = require('../../fixtures/populate');
var db = require('../../fixtures/db');

function exec(host, port, dbName) {
  return db.connect(commons.getDBOptions(host, port, dbName))
    .then(populateFixture.populateAll)
    .then(db.disconnect)
    .finally(function() {
      console.log('Populated!');
    });
}
module.exports.exec = exec;

module.exports.createCommand = function(command) {
  command
    .description('Populate OpenPaaS Resources')
    .option('-h, --host <host>', 'database host to connect to')
    .option('-p, --port <port>', 'database port to connect to')
    .option('-d, --database <database>', 'database name to connect to')
    .action(function(cmd) {
      exec(cmd.host, cmd.port, cmd.database).then(function() {
        console.log('Populated');
      }, function(err) {
        console.log('Error', err);
      }).finally(commons.exit);
    });
};
