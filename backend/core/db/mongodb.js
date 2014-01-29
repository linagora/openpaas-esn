'use strict';
//
// MongoDB utilities
//

var MongoClient = require('mongodb').MongoClient;

/**
 * Checks that we can connect to mongodb
 *
 * @param {string} host
 * @param {string} port
 * @param {string} dbname
 * @param {function} callback
 */
function checkConnection(hostname, port, dbname, callback) {
  if (!hostname || !port || !dbname) {
    return callback(new Error('hostname, port and dbname are required'));
  }
  var url = 'mongodb://' + hostname + ':' + port + '/' + dbname;
  var timeout = process.env.MONGO_TIMEOUT || 10000;

  MongoClient.connect(url, {
    server: {
      socketOptions: {
        connectTimeoutMS: timeout,
        socketTimeoutMS: timeout
      }
    }
  }, function(err, db) {
    if (err) {
      callback(err);
    } else {
      db.close(function(err, data) {
        // ignore error on close
        callback();
      });
    }
  });
}
module.exports.checkConnection = checkConnection;
