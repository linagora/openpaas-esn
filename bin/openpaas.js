'use strict';

var q = require('q');
var populate = require('./commands/populate');
var configure = require('./commands/configure');
var commons = require('./commons');

function init() {
  if (process.env.INIT_DB) {
    var host = process.env.MONGO_HOST || 'localhost';
    var port = process.env.MONGO_PORT || '27017';
    var dbName = process.env.MONGO_DBNAME || 'esn';

    return configure.exec(host, port, dbName).then(function() {
      return populate.exec(host, port, dbName).then(function() {
        console.log('ESN configured');
        return q();
      }, function() {
        console.log('Warning, error while populating, the ESN may not work properly');
        return q();
      });
    });
  }
  return q();
}

init().then(function() {
  require('../server');
}, function(err) {
  console.log('Error while initializing data', err);
  commons.exit();
});
