'use strict';

var q = require('q');
var fs = require('fs-extra');
var path = require('path');
var core = require('../../backend/core/');
var esnconfig = core['esn-config'];
var dataPath = path.resolve(__dirname + '/data');

function _injectConf(key, conf) {
  return q.ninvoke(esnconfig(key), 'store', conf).catch(function() {
    return;
  });
}

function _injectAllConf(files) {
  var promiseFuncs = files.map(function(filename) {
    var file = dataPath + '/' + filename;

    if (fs.statSync(file).isFile()) {
      return function() {
        var key = filename.slice(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));
        var conf = require(dataPath + '/' + key)();

        console.log('[INFO] Inject conf', key);
        console.log(JSON.stringify(conf, null, 2));

        return _injectConf(key, conf); // allways resolves
      };
    }
  }).filter(Boolean);

  return promiseFuncs.reduce(q.when, q()); // https://github.com/kriskowal/q#sequences
}

module.exports = function() {
  console.log('[INFO] ESN Configuration');

  var readdir = q.denodeify(fs.readdir);

  return readdir(dataPath).then(_injectAllConf);
};
