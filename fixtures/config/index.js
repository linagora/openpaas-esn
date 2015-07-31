'use strict';

var q = require('q');
var fs = require('fs-extra');
var path = require('path');
var configPath = path.resolve(__dirname + '/../../config');
var dataPath = path.resolve(__dirname + '/data');

function _copyFiles(files) {
  var promises = [];
  var copy = q.denodeify(fs.copy);
  files.forEach(function(filename) {
      var from = dataPath + '/' + filename;
      var to = configPath + '/' + filename;
      if (fs.statSync(from).isFile()) {
        console.log('[INFO] Copy ', from);
        promises.push(copy(from, to));
      }
  });
  return promises;
}

module.exports = function() {
  console.log('[INFO] Copy configuration files');
  var readdir = q.denodeify(fs.readdir);
  return readdir(dataPath)
    .then(function(files) {
      return q.all(_copyFiles(files));
    });
};
