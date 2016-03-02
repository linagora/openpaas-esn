'use strict';

var q = require('q');
var dbFixture = require('../../fixtures/config/data/db');
var fs = require('fs');
var path = require('path');
var commons = require('../commons');

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
module.exports.exec = exec;

module.exports.createCommand = function(command) {
  command
    .description('Generate and save db.json configuration file')
    .option('-h, --host <host>', 'host services are running on')
    .option('-p, --port <port>', 'database port to connect to')
    .option('-d, --database <database>', 'database name to connect to')
    .action(function(cmd) {
      exec(cmd.host, cmd.port, cmd.database).then(function() {
        console.log('Saved!');
      }, function(err) {
        console.log('Error', err);
      }).finally(commons.exit);
    });
};
