'use strict';

var pubsub = require('../../core/pubsub').global,
  logger = require('../../core/logger'),
  helper = require('../helper/socketio');

var initialized = false;

var TOPIC = 'notification:api';
var NAMESPACE = '/notifications';
var NOTIFICATION_EVENT = 'notification';

function notify(io, user, notification) {
  var clientSockets = helper.getUserSocketsFromNamespace(user, io.of(NAMESPACE).sockets);
  logger.debug('notify for notification', user, ', found', clientSockets.length, 'websockets');
  if (!clientSockets) {
    return;
  }
  clientSockets.forEach(function(socket) {
    socket.emit(NOTIFICATION_EVENT, notification);
  });
}

function init(io) {
  if (initialized) {
    logger.warn('The notification notifications service is already initialized');
    return;
  }

  pubsub.topic(TOPIC).subscribe(function(notification) {
    notification.target.forEach(function(user) {
      notify(io, user, notification);
    });
  });

  io.of(NAMESPACE).on('connection', function(socket) {
    logger.info('User', socket.handshake.query.user, ': new connection on ' + NAMESPACE);

    socket.on('subscribe', function(uuid) {
      logger.info('User', socket.handshake.query.user, ': joining room /', NAMESPACE, '/', uuid);
      socket.join(uuid);
    });

    socket.on('unsubscribe', function(uuid) {
      logger.info('User', socket.handshake.query.user, ': leaving room /', NAMESPACE, '/', uuid);
      socket.leave(uuid);
    });
  });
  initialized = true;
}

module.exports.init = init;
