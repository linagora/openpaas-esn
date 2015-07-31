'use strict';

var q = require('q');
var fs = require('fs-extra');
var path = require('path');
var mongoose = require('mongoose');
var core = require('../../backend/core/');
var esnconfig = core['esn-config'];
var dataPath = path.resolve(__dirname + '/data');
var dbPath = path.resolve(__dirname + '/../config/data/db.json');

function _injectConf(key, conf) {
  return q.nfcall(esnconfig(key).store, conf);
}

function _injectAllConf(files) {
  var promises = [];
  files.forEach(function(filename) {
    var file = dataPath + '/' + filename;
    if (fs.statSync(file).isFile()) {
      var key = filename.slice(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));
      var conf = fs.readJsonSync(file);
      console.log('[INFO] Inject conf', key);
      console.log(JSON.stringify(conf, null, 2));;
      promises.push(_injectConf(key, conf));
    }
  });
  return promises;
}

module.exports = function() {
  console.log('[INFO] ESN Configuration');
  var deferred = q.defer();
  var readdir = q.denodeify(fs.readdir);
  var dbConf = fs.readJsonSync(dbPath);
  mongoose.connect(dbConf.connectionString);
  mongoose.connection.on('connected', function() {
    readdir(dataPath)
      .then(function(files) {
        return q.allSettled(_injectAllConf(files));
      })
      .then(deferred.resolve);
  });
  return deferred.promise;
};
