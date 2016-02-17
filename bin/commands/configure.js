'use strict';

var q = require('q');
var commons = require('../commons');
var configFixture = require('../../fixtures/esn-config');
var db = require('../../fixtures/db');

function exec(host, port, dbName) {
  return db.connect(commons.getDBOptions(host, port, dbName))
    .then(configFixture)
    .then(db.disconnect)
    .catch(function(err) {
      console.log(err);
    })
    .finally(function() {
      console.log('Configured');
    });
}
module.exports.exec = exec;

module.exports.createCommand = function(command) {
  command
    .description('Configure OpenPaaS')
    .option('-h, --host <host>', 'database host to connect to')
    .option('-p, --port <port>', 'database port to connect to')
    .option('-db, --database <database>', 'database name to connect to')
    .action(function(cmd) {
      exec(cmd.host, cmd.port, cmd.database).then(function() {
        console.log('Configured');
      }, function(err) {
        console.log('Error', err);
      }).finally(commons.exit);
    });
};
