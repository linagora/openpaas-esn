'use strict';

var commons = require('../commons');
var populateFixture = require('../../fixtures/populate');
var configFixture = require('../../fixtures/esn-config');
var db = require('../../fixtures/db');

function exec(host, port, dbName) {

  host = host || 'localhost';
  process.env.MONGO_HOST = host;
  process.env.REDIS_HOST = host;
  process.env.AMQP_HOST = host;
  process.env.ELASTICSEARCH_HOST = host;
  process.env.DAV_SERVER_HOST = host;
  process.env.DAV_SERVER_PORT = 8001;
  process.env.WEB_HOST = 'localhost';
  process.env.MAIL_BROWSER = false;
  process.env.SMTP_HOST = host;
  process.env.SMTP_PORT = 1025;

  return db.connect(commons.getDBOptions(host, port, dbName))
    .then(configFixture)
    .then(() => populateFixture.populateAll(host))
    .then(db.disconnect)
    .finally(function() {
      console.log('Docker data initialized!');
    });
}
module.exports.exec = exec;

module.exports.createCommand = function(command) {
  command
    .description('Dev Setup for Docker Compose')
    .option('-h, --host <host>', 'host services are running on')
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
