'use strict';

var logger = require('../core/logger');
var io = require('socket.io');
var express = require('express');
var store = require('./socketstore');
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var ESN_MODULE_PREFIX = require('../module-manager').ESN_MODULE_PREFIX;

var WEBSOCKETS_NAMESPACES = ['/ws'];

var wsserver = {
  server: null,
  port: null,
  started: false,
  namespaces: WEBSOCKETS_NAMESPACES
};

/*
 * options should be {'match origin protocol' : true, 'transports' : ['websocket']}
 * for ssl transport.
 */
function start(port, options, callback) {
  if (arguments.length === 0) {
    logger.error('Websocket server start method should have at least 1 argument');
    process.exit(1);
  }

  callback = callback || options || function() {};

  function listenCallback(err) {
    wsserver.server.removeListener('listening', listenCallback);
    wsserver.server.removeListener('error', listenCallback);
    callback(err);
  }

  if (wsserver.started) {
    return callback();
  }
  wsserver.started = true;

  var webserver = require('../webserver').webserver;
  wsserver.port = port;
  var realCallback = callback;
  if (webserver && webserver.sslserver && webserver.ssl_port === wsserver.port) {
    logger.debug('websocket server will be attached to the SSL Express server');
    wsserver.server = webserver.sslserver;
  } else if (webserver && webserver.server && webserver.port === wsserver.port) {
    logger.debug('websocket server will be attached to the Express server');
    wsserver.server = webserver.server;
  } else {
    logger.debug('websocket server will launch a new Express server');
    wsserver.server = express().listen(wsserver.port);
    wsserver.server.on('listening', listenCallback);
    wsserver.server.on('error', listenCallback);
    realCallback = function() {};
  }

  var sio = io.listen(wsserver.server, options);
  if (sio) {
    sio.configure(function() {
      sio.set('authorization', require('./auth/token'));
    });

    sio.sockets.on('connection', function(socket) {
      var user = socket.handshake.user;
      store.registerSocket(socket, user);
      logger.info('Socket is connected for user = ' + user);
      socket.on('disconnect', function() {
        logger.info('Socket is disconnected for user = ' + user);
        store.unregisterSocket(socket);
      });
    });

    wsserver.io = sio;
    require('./events')(sio);
  }
  return realCallback();
}

wsserver.start = start;

var awesomeWsServer = new AwesomeModule(ESN_MODULE_PREFIX + 'wsserver', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, ESN_MODULE_PREFIX + 'config', 'conf'),
    new Dependency(Dependency.TYPE_NAME, ESN_MODULE_PREFIX + 'webserver', 'webserver')
  ],
  lib: function(dependencies, callback) {
    var api = wsserver;
    return callback(null, api);
  },
  start: function(dependencies, callback) {
    var config = dependencies('conf')('default');

    if (!config.wsserver.enabled) {
      logger.warn('The websocket server will not start as expected by the configuration.');
      return callback();
    }

    wsserver.start(config.wsserver.port, config.wsserver.options, function(err) {
      if (err) {
        logger.error('websocket server failed to start', err);
      }
      callback.apply(this, arguments);
    });
  }
});

module.exports.wsserver = wsserver;
module.exports.awesomeWsServer = awesomeWsServer;
