'use strict';
//
// MongoDB utilities

var MongoClient = require('mongodb').MongoClient;
var url = require('url');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var logger = require('../../../core').logger;
var config = require('../../../core').config;
var initialized = false;

function onConnectError(err) {
  logger.error('Failed to connect to MongoDB:', err.message);
}

mongoose.connection.on('error', function(e) {
  onConnectError(e);
  initialized = false;
});

var getTimeout = function() {
  return process.env.MONGO_TIMEOUT || 10000;
};

function storeConfiguration(configuration, callback) {
  var root = path.resolve(__dirname + '/../../../..');
  var defaultConfig = config('default');
  var dbConfigurationFile;
  if (defaultConfig.core && defaultConfig.core.config && defaultConfig.core.config.db) {
    dbConfigurationFile = path.resolve(root + '/' + defaultConfig.core.config.db);
  } else {
    dbConfigurationFile = root + '/config/db.json';
  }
  fs.writeFile(dbConfigurationFile, JSON.stringify(configuration), function(err) {
    if (err) {
      logger.error('Cannot write database configuration file', dbConfigurationFile, err);
      var error = new Error('Can not write database settings in ' + dbConfigurationFile);
      return callback(error);
    }
    return callback(null, configuration);
  });
}

module.exports.storeConfiguration = storeConfiguration;

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
  var timeout = getTimeout();
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
      w: 1,
      fsync: true,
      native_parser: true
    },
    server: {
      socketOptions: {
        keepAlive: timeout,
        connectTimeoutMS: timeout
      },
      auto_reconnect: true,
      poolSize: 10
    }
  };
}

module.exports.getDefaultOptions = getDefaultOptions;

function getConnectionStringAndOptions() {
  var config;
  try {
    config = require(__dirname + '/../../../core').config('db');
  } catch (e) {
    return false;
  }
  if (!config || !config.hostname) {
    return false;
  }
  var options = config.connectionOptions ? config.connectionOptions : getDefaultOptions();
  var url = getConnectionString(config.hostname, config.port, config.dbname, config.username, config.password, {});
  return {url: url, options: options};
}

module.exports.init = function() {
  if (initialized) {
    mongoose.disconnect();
    initialized = false;
  }
  var connectionInfos = getConnectionStringAndOptions();
  if (!connectionInfos) {
    return false;
  }

  try {
    mongoose.connect(connectionInfos.url, connectionInfos.options);
  } catch (e) {
    onConnectError(e);
    return false;
  }
  initialized = true;
  return true;
};

module.exports.isInitalized = function() {
  return initialized;
};

// load models
module.exports.models = {};
fs.readdirSync(__dirname + '/models').forEach(function(filename) {
  var stat = fs.statSync(__dirname + '/models/' + filename);
  if (!stat.isFile()) { return; }
  require('./models/' + filename);
});
