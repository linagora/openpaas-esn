'use strict';

/* eslint-disable no-process-env */

const url = require('url');
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');

mongoose.Promise = require('q').Promise; // http://mongoosejs.com/docs/promises.html

const logger = require('../../../core').logger;
const config = require('../../../core').config;
const topic = require('../../../core').pubsub.local.topic('mongodb:connectionAvailable');
const configurationWatcher = require('./file-watcher');

let initialized = false;
let connected = false;
let dbConfigWatcher = null;
const models = {};
const schemas = {};

module.exports = {
  storeConfiguration,
  validateConnection,
  getConnectionString,
  getDefaultOptions,
  init,
  isInitalized,
  isConnected,
  models,
  schemas,
  mongoose
};

mongoose.connection.on('error', err => {
  onConnectError(err);
  initialized = false;
});

mongoose.connection.on('connected', err => {
  logger.debug('Connected to MongoDB', err);
  connected = true;
  topic.publish();
});

mongoose.connection.on('disconnected', () => {
  logger.debug('Connection to MongoDB has been lost');
  connected = false;
  if (forceReconnect()) {
    logger.debug('Reconnecting to MongoDB');
    mongooseConnect();
  }
});

fs.readdirSync(__dirname + '/models').forEach(filename => {
  const stat = fs.statSync(__dirname + '/models/' + filename);

  if (!stat.isFile()) { return; }
  models[filename.replace('.js', '')] = require('./models/' + filename);
});

fs.readdirSync(__dirname + '/schemas').forEach(filename => {
  const stat = fs.statSync(__dirname + '/schemas/' + filename);

  if (!stat.isFile()) { return; }
  schemas[filename.replace('.js', '')] = require('./schemas/' + filename);
});

function forceReconnect() {
  if (process.env.MONGO_FORCE_RECONNECT) {
    return process.env.MONGO_FORCE_RECONNECT;
  }

  const defaultConfig = config('default');

  return !!(defaultConfig.db && defaultConfig.db.forceReconnectOnDisconnect);
}

function onConnectError(err) {
  logger.error('Failed to connect to MongoDB:', err);
}

function getTimeout() {
  return process.env.MONGO_TIMEOUT || 10000;
}

function getHost() {
  return process.env.MONGO_HOST || 'localhost';
}

function getPort() {
  return process.env.MONGO_PORT || '27017';
}

function getDbName() {
  return process.env.MONGO_DBNAME || 'esn';
}

function getUsername() {
  return process.env.MONGO_USERNAME;
}

function getPassword() {
  return process.env.MONGO_PASSWORD;
}

function openDatabase(connectionString, callback) {
  MongoClient.connect(connectionString, (err, db) => {
    if (err && db && ('close' in db)) {
      db.close();
    }
    callback(err, db);
  });
}

function insertDocument(db, collectionName, document, callback) {
  const collection = db.collection(collectionName);

  collection.insert(document, (err, coll) => {
    if (err) {
      db.close(() => {
        //ignore error
      });
    }

    return callback(err, coll);
  });
}

function dropCollection(db, collectionName, callback) {
  db.dropCollection(collectionName, err => {
    db.close(() => {
      //ignore error
    });

    return callback(err);
  });
}

function getConnectionString(hostname, port, dbname, username, password, connectionOptions) {
  const timeout = getTimeout();

  connectionOptions = connectionOptions || {
    connectTimeoutMS: timeout,
    socketTimeoutMS: timeout
  };

  const connectionHash = {
    protocol: 'mongodb',
    slashes: true,
    hostname: hostname,
    port: port,
    pathname: '/' + dbname,
    query: connectionOptions
  };

  if (username) {
    connectionHash.auth = username + ':' + password;
  }

  return url.format(connectionHash);
}

function getDefaultConnectionString() {
  return getConnectionString(getHost(), getPort(), getDbName(), getUsername(), getPassword());
}

function getDbConfigurationFile() {
  const root = path.resolve(__dirname + '/../../../..');
  const defaultConfig = config('default');
  let dbConfigurationFile;

  if (defaultConfig.core && defaultConfig.core.config && defaultConfig.core.config.db) {
    dbConfigurationFile = path.resolve(root + '/' + defaultConfig.core.config.db);
  } else {
    dbConfigurationFile = root + '/config/db.json';
  }

  return dbConfigurationFile;
}

function storeConfiguration(configuration, callback) {
  const dbConfigurationFile = getDbConfigurationFile();
  const finalConfiguration = {};

  finalConfiguration.connectionOptions = configuration.connectionOptions;
  finalConfiguration.connectionString = getConnectionString(configuration.hostname,
                                                            configuration.port,
                                                            configuration.dbname,
                                                            configuration.username,
                                                            configuration.password,
                                                            {});

  fs.writeFile(dbConfigurationFile, JSON.stringify(finalConfiguration), err => {
    if (err) {
      logger.error('Cannot write database configuration file', dbConfigurationFile, err);
      const error = new Error('Can not write database settings in ' + dbConfigurationFile);

      return callback(error);
    }

    return callback(null, finalConfiguration);
  });
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

  const connectionString = getConnectionString(hostname, port, dbname, username, password);

  const collectionName = 'connectionTest';
  const document = {test: true};

  openDatabase(connectionString, (err, db) => {
    if (err) {
      return callback(err);
    }
    insertDocument(db, collectionName, document, err => {
      if (err) {
        return callback(err);
      }
      dropCollection(db, collectionName, callback);
    });
  });
}

function getDefaultOptions() {
  const timeout = getTimeout();

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

function getConnectionStringAndOptions() {
  let dbConfig;

  try {
    dbConfig = config('db');
  } catch (e) {
    return false;
  }
  if (!dbConfig) {
    return false;
  }

  if (!dbConfig.connectionString) {
    dbConfig.connectionString = getDefaultConnectionString();
  }

  const options = dbConfig.connectionOptions ? dbConfig.connectionOptions : getDefaultOptions();

  return {url: dbConfig.connectionString, options: options};
}

function mongooseConnect(reinit) {
  const defaultConfig = config('default');

  if (defaultConfig.db && defaultConfig.db.reconnectOnConfigurationChange) {
    if (!dbConfigWatcher) {
      dbConfigWatcher = configurationWatcher(logger, getDbConfigurationFile(), reinit);
    }
    dbConfigWatcher();
  }

  const connectionInfos = getConnectionStringAndOptions();

  if (!connectionInfos) {
    return false;
  }

  try {
    logger.debug('launch mongoose.connect on ' + connectionInfos.url);
    mongoose.connect(connectionInfos.url, connectionInfos.options);
  } catch (e) {
    onConnectError(e);

    return false;
  }
  initialized = true;

  return true;
}

function init() {
  function reinit() {
    logger.info('Database configuration updated, reloading mongoose');
    config.clear();
    init();
  }

  if (initialized) {
    mongoose.disconnect(() => {
      initialized = false;
      mongooseConnect(reinit);
    });

    return;
  }

  return mongooseConnect(reinit);
}

function isInitalized() {
  return initialized;
}

function isConnected() {
  return connected;
}
