'use strict';

var logger = require('../../../core/logger');
var esnconfig = require('../../../core/esn-config');
var pubsub = require('../../../core/pubsub').local;

module.exports = {
  createClient,
  initHealthCheck,
  init,
  isInitialized,
  isConnected,
  getClient,
  _getClient
};

var initialized = false;
var connected = false;
var client;

var defaultOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

var getRedisConfiguration = function(options) {
  var redisConfig = options || defaultOptions;

  if (redisConfig.url) {
    var url = require('url').parse(redisConfig.url);
    if (url.protocol === 'redis:') {
      if (url.auth) {
        var userparts = url.auth.split(':');
        redisConfig.user = userparts[0];
        if (userparts.length === 2) {
          redisConfig.pass = userparts[1];
        }
      }
      redisConfig.host = url.hostname;
      redisConfig.port = url.port;
      if (url.pathname) {
        redisConfig.db = url.pathname.replace('/', '', 1);
      }
    }
  }

  pubsub.topic('redis:configurationAvailable').publish(redisConfig);
  return redisConfig;
};

function createClient(options, callback) {
  var redisConfig = getRedisConfiguration(options);

  var client = redisConfig.client || require('redis').createClient(redisConfig.port || redisConfig.socket, redisConfig.host, redisConfig);
  if (redisConfig.pass) {
    client.auth(redisConfig.pass, function(err) {
      if (err) {
        callback(err);
      }
    });
  }

  if (redisConfig.db) {
    client.select(redisConfig.db);
    client.on('connect', function() {
      client.send_anyways = true;
      client.select(redisConfig.db);
      client.send_anyways = false;
    });
  }

  client.on('error', function(err) {
    logger.error('Redis connection error', err);
  });

  client.on('connect', function() {
    logger.info('Connected to Redis', redisConfig);
    connected = true;
  });

  client.on('ready', function() {
    logger.info('Redis is Ready');
  });

  return callback(null, client);
}

function init(callback) {
  esnconfig('redis').get(function(err, config) {
    if (err) {
      logger.error('Error while getting the redis configuration', err);
      return callback(err);
    }
    createClient(config, function(err, client) {
      if (client) {
        initialized = true;
      }
      return callback(err, client);
    });
  });
}

function initHealthCheck() {
  // Register health check service
  const healthCheck = require('./health-check');
  healthCheck.register(_getClient);
}

pubsub.topic('mongodb:connectionAvailable').subscribe(function() {
  init(function(err, c) {
    if (err) {
      logger.error('Error while creating redis client', err);
    }

    if (c) {
      client = c;
    }
  });
});

function isInitialized() {
  return initialized;
}

function isConnected() {
  return connected;
}

function _getClient() {
  return client;
}

function getClient(callback) {
  if (this.isConnected() && this._getClient()) {
    return callback(null, client);
  } else {
    return this.init(callback);
  }
}
