'use strict';

var logger = require('../core/logger');
var io = require('socket.io');
var express = require('express');
var authtoken = require('../core/auth/token');
var pubsub = require('../core/pubsub').local;

var WEBSOCKETS_NAMESPACES = ['/ws'];

var wsserver = {
  server: null,
  port: null,
  started: false,
  namespaces: WEBSOCKETS_NAMESPACES
};

exports = module.exports = wsserver;

function start(port, callback) {
  if (arguments.length === 0) {
    logger.error('Websocket server start method should have at least 1 argument');
    process.exit(1);
  }

  callback = callback || function() {};

  function listenCallback(err) {
    wsserver.server.removeListener('listening', listenCallback);
    wsserver.server.removeListener('error', listenCallback);
    callback(err);
  }


  if (wsserver.started) {
    return callback();
  }
  wsserver.started = true;

  var webserver = require('../webserver');
  wsserver.port = port;
  var realCallback = callback;
  if (webserver && webserver.server && webserver.port === wsserver.port) {
    logger.debug('websocket server will be attached to the Express server');
    wsserver.server = webserver.server;
  } else {
    logger.debug('websocket server will launch a new Express server');
    wsserver.server = express().listen(wsserver.port);
    wsserver.server.on('listening', listenCallback);
    wsserver.server.on('error', listenCallback);
    realCallback = function() {};
  }

  var sio = io.listen(wsserver.server);
  sio.configure(function() {
    sio.set('authorization', function(handshakeData, callback) {
      if (!handshakeData.query.token || !handshakeData.query.user) {
        return callback(new Error('Token or user not found'));
      }
      authtoken.getToken(handshakeData.query.token, function(err, data) {
        if (err ||   !data) {
          return callback(null, false);
        }

        if (handshakeData.query.user !== data.user) {
          return callback(new Error('Bad user'));
        }

        handshakeData.user = data.user;
        return callback(null, true);
      });
    });
  });

  sio.sockets.on('connection', function(socket) {
    var user = socket.handshake.user;

    socket.on('disconnect', function() {
      console.log('Socket is disconnected for user = ', user);
    });

    pubsub.topic('login:success').subscribe(function(user) {
      socket.broadcast.emit('user:login', user);
    });
  });

  realCallback();
}

wsserver.start = start;
