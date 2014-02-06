'use strict';

require('./env');
var fs = require('fs');
exports = module.exports = {};

fs.readdirSync(__dirname).forEach(function(filename) {
  var stat = fs.statSync(__dirname + '/' + filename);
  if (!stat.isDirectory()) { return; }
  function load() { return require('./' + filename); }
  exports.__defineGetter__(filename, load);
});

// try to initialize Mongo
if (!exports.db.mongo.init()) {
  console.log('The MongoDB datastore could not be initialized');
}
