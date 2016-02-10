'use strict';

var q = require('q');
var fs = require('fs-extra');
var path = require('path');
var core = require('../../backend/core/');
var esnconfig = core['esn-config'];
var dataPath = path.resolve(__dirname + '/data');

function _injectConf(key, conf) {
  return q.ninvoke(esnconfig(key), 'store', conf);
}

function _injectAllConf(files) {
  var promises = [];
  files.forEach(function(filename) {
    var file = dataPath + '/' + filename;
    if (fs.statSync(file).isFile()) {
      var key = filename.slice(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));
      var conf = require(dataPath + '/' + key)();
      console.log('[INFO] Inject conf', key);
      console.log(JSON.stringify(conf, null, 2));
      promises.push(_injectConf(key, conf));
    }
  });
  return promises;
}

module.exports = function() {
  console.log('[INFO] ESN Configuration');
  var deferred = q.defer();
  var readdir = q.denodeify(fs.readdir);

  readdir(dataPath).then(function(files) {
    return q.allSettled(_injectAllConf(files));
  }).then(deferred.resolve, deferred.reject);

  return deferred.promise;
};
