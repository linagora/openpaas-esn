'use strict';

var q = require('q');
var commons = require('../commons');
var EsnConfig = require('esn-elasticsearch-configuration');
var indexes = ['users', 'contacts', 'events'];

function exec(host, port, index) {
  host = host || 'localhost';
  port = port || 9200;

  var esnConf = new EsnConfig({host: host, port: port});
  if (index) {
    return esnConf.createIndex(index);
  } else {
    return q.all(indexes.map(function(index) {
      return esnConf.createIndex(index);
    }));
  }
}
module.exports.exec = exec;

module.exports.createCommand = function(command) {
  command
    .description('Configure ElasticSearch')
    .option('-h, --host <host>', 'elasticsearch host to connect to')
    .option('-p, --port <port>', 'elasticsearch port to connect to')
    .option('-i, --index <index>', 'index to create')
    .action(function(cmd) {
      exec(cmd.host, cmd.port, cmd.index).then(function() {
        console.log('ElasticSearch has been configured');
      }, function(err) {
        console.log('Error', err);
      }).finally(commons.exit);
    });
};
