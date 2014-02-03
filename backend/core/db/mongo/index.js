'use strict';
//
// MongoDB utilities

var MongoClient = require('mongodb').MongoClient;
var url = require('url');

function openDatabase(connectionString, callback) {
  MongoClient.connect(connectionString, function(err, db) {
    if (err && db && ('close' in db)) {
      db.close();
    }
    callback(err, db);
  });
}

function insertDocument(db, collectionName, document, callback) {
  var collection = db.collection(collectionName);
  collection.insert(document, function(err, coll) {
    if (err) {
      db.close(function(err, data) {
        //ignore error
      });
    }
    return callback(err, coll);
  });
}

function dropCollection(db, collectionName, callback) {
  db.dropCollection(collectionName, function(err, data) {
    db.close(function(err, data) {
        //ignore error
    });
    return callback(err);
  });
}

function getConnectionString(hostname, port, dbname, username, password, connectionOptions) {
  var timeout = process.env.MONGO_TIMEOUT || 10000;
  connectionOptions = connectionOptions || {
    connectTimeoutMS: timeout,
    socketTimeoutMS: timeout
  };

  var connectionHash = {
    hostname: hostname,
    port: port,
    pathname: '/' + dbname,
    query: connectionOptions
  };
  if (username) {
    connectionHash.auth = username + ':' + password;
  }

  return 'mongodb:' + url.format(connectionHash);
}


var getTimeout = function() {
  return process.env.MONGO_TIMEOUT || 10000;
};

/**
 * Checks that we can connect to mongodb
 *
 * @param {string} hostname
 * @param {string} port
 * @param {string} dbname
 * @param {string} username
 * @param {string} password
 * @param {function} callback
 */
function validateConnection(hostname, port, dbname, username, password, callback) {

  var connectionString = getConnectionString(hostname, port, dbname, username, password);

  var collectionName = 'connectionTest';
  var document = {test: true};

  openDatabase(connectionString, function(err, db) {
    if (err) {
      return callback(err);
    }
    insertDocument(db, collectionName, document, function(err) {
      if (err) {
        return callback(err);
      }
      dropCollection(db, collectionName, callback);
    });
  });
}

module.exports.validateConnection = validateConnection;
module.exports.getConnectionString = getConnectionString;

function getDefaultOptions() {
  var timeout = getTimeout();
  return {
    db: {
      w: 'majority',
      native_parser: true,
      fsync: true,
      journal: true
    },
    server: {
      socketOptions: {
        connectTimeoutMS: timeout,
        socketTimeoutMS: timeout
      },
      auto_reconnect: true
    }
  };
}

module.exports.getDefaultOptions = getDefaultOptions;

module.exports.client = function(url, callback) {
  var config = require('../../core').config('db');
  if (!config || !config.hostname) {
    return callback(new Error('MongoDB configuration not set'));
  }

  var connectionOptions = config.connectionOptions ? config.connectionOptions : getDefaultOptions();
  MongoClient.connect(url, connectionOptions, callback);
};
