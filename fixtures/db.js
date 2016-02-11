'use strict';

var q = require('q');
var fs = require('fs-extra');
var mongoose = require('mongoose');

function connect(config) {
  var defer = q.defer();
  mongoose.connect(config.connectionString, function() {
    console.log('CONNECTED');
    console.log('Connected to MongoDB at', config.connectionString);
    defer.resolve();
  });

  return defer.promise;
}
module.exports.connect = connect;

module.exports.connectFromFileConfig = function() {
  var dbPath = path.resolve(__dirname + '/config/data/db.json');
  var dbConf = fs.readJsonSync(dbPath);
  return connect(dbConf);
};

module.exports.disconnect = function() {
  var defer = q.defer();
  console.log('Disconnecting from MongoDB');
  mongoose.disconnect(function() {
    defer.resolve();
  });
  return defer.promise;
};
