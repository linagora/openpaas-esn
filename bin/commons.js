'use strict';

module.exports.getDBOptions = function(host, port, dbName) {

  host = host || 'localhost';
  port = port || 27017;
  dbName = dbName || 'esn';

  return {connectionString: 'mongodb://' + host + ':' + port + '/' + dbName};
};

module.exports.exit = function() {
  console.log('Done');
  process.exit();
};
