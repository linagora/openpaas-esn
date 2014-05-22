'use strict';

var logger = require('../../../core').logger;
var config = require('../../../core').config;
var esnconfig = require('../../../core/esn-config');
var topic = require('../../../core').pubsub.local.topic('mongodb:connectionAvailable');
var initialized = false;
var connected = false;
var client;

var defaultOptions = {
  host: 'localhost',
  port: 6379
};

topic.subscribe(function() {
  init(function(err, c) {
    if (err) {
      logger.error('Error while creating redis client', err);
    }

    if (c) {
      client = c;
    }
  })
});

function init(callback) {
  esnconfig('redis').get(function(err, config) {
    if (err) {
      logger.error('Error while getting the redis configuration', err);
      callback(err);
    }
    createClient(config, function(err, client) {
      if (client) {
        initialized = true;
      }
      return callback(err, client);
    });
  });
};
module.exports.init = init;

function createClient(options, callback) {
  options = options || defaultOptions;

  if (options.url) {
    var url = require('url').parse(options.url);
    if (url.protocol === 'redis:') {
      if (url.auth) {
        var userparts = url.auth.split(":");
        options.user = userparts[0];
        if (userparts.length === 2) {
          options.pass = userparts[1];
        }
      }
      options.host = url.hostname;
      options.port = url.port;
      if (url.pathname) {
        options.db = url.pathname.replace("/", "", 1);
      }
    }
  }

  var client = options.client || new require('redis').createClient(options.port || options.socket, options.host, options);
  if (options.pass) {
    client.auth(options.pass, function(err){
      if (err) {
        callback(err);
      }
    });
  }

  if (options.db) {
    client.select(options.db);
    client.on('connect', function() {
      client.send_anyways = true;
      client.select(options.db);
      client.send_anyways = false;
    });
  }

  client.on('error', function(err) {
    console.log(err);
    logger.error('Redis connection error', err);
  });

  client.on('connect', function() {
    logger.info('Connected to Redis', options);
    connected = true;
  });

  return callback(null, client);
};

module.exports.isInitalized = function() {
  return initialized;
};

module.exports.isConnected = function() {
  return connected;
};

module.exports.getClient = function(callback) {
  if (connected && client) {
    return callback(null, client);
  } else {
    return init(callback)
  }
};
