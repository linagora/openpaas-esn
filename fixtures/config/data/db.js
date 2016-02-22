'use strict';

module.exports = function(dbHost, dbPort, dbName) {

  var host = process.env.MONGO_HOST || dbHost || 'localhost';
  var port = process.env.MONGO_PORT || dbPort || '27017';
  var name = process.env.MONGO_DBNAME || dbName || 'esn';

  return {
    'connectionOptions': {
      'db': {
        'w':1,
        'fsync':true,
        'native_parser':true
      },
      'server':{
        'socketOptions': {
          'keepAlive':10000,
          'connectTimeoutMS':10000
        },
        'auto_reconnect':true,
        'poolSize':10
      }
    },
    'connectionString':'mongodb://'+ host + ':' + port + '/' + name
  }
};
