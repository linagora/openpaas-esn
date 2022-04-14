'use strict';

var logger = require('../core/logger');
var io = require('socket.io');
var express = require('express');
var store = require('./socketstore');
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var ESN_MODULE_PREFIX = require('../module-manager').ESN_MODULE_PREFIX;
var socketioHelper = require('./helper/socketio');
var pubsub = require('../core/pubsub/local');

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
    logger.debug('websocket server will be attached to the IPv4 SSL Express server');
    wsserver.server = webserver.sslserver;
  } else if (webserver && webserver.server && webserver.port === wsserver.port) {
    logger.debug('websocket server will be attached to the IPv4 Express server');
    wsserver.server = webserver.server;
  } else if (webserver && webserver.sslserver6 && webserver.ssl_port === wsserver.port) {
    logger.debug('websocket server will be attached to the IPv6 SSL Express server');
    wsserver.server = webserver.sslserver6;
  } else if (webserver && webserver.server6 && webserver.port === wsserver.port) {
    logger.debug('websocket server will be attached to the IPv6 Express server');
    wsserver.server = webserver.server6;
  } else {
    logger.debug('websocket server will launch a new Express server');
    wsserver.server = express().listen(wsserver.port);
    wsserver.server.on('listening', listenCallback);
    wsserver.server.on('error', listenCallback);
    realCallback = function() {};
  }

  var sio = io(wsserver.server, options);
  var userConnectionTopic = pubsub.topic('user:connection');
  var userDisconnectionTopic = pubsub.topic('user:disconnection');
  if (sio) {
    sio.use(require('./auth/jwt'));

    sio.on('connection', function(socket) {
      var user = socketioHelper.getUserId(socket);
      userConnectionTopic.publish(user);
      store.registerSocket(socket);
      logger.info('Socket is connected for user = ' + user);
      socket.on('disconnect', function() {
        userDisconnectionTopic.publish(user);
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

function cleanAllWebsockets() {
  store.clean();
}
wsserver.cleanAllWebsockets = cleanAllWebsockets;

var awesomeWsServer = new AwesomeModule(ESN_MODULE_PREFIX + 'wsserver', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, ESN_MODULE_PREFIX + 'config', 'conf')
  ],
  states: {
    lib: function(dependencies, callback) {
      var api = wsserver;
      api.ioHelper = socketioHelper;
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
  }
});

module.exports.wsserver = wsserver;
module.exports.awesomeWsServer = awesomeWsServer;
