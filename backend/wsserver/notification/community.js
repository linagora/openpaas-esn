'use strict';

var core = require('../../core'),
  pubsub = core.pubsub.global,
  logger = core.logger,
  helper = require('../helper/socketio');

var initialized = false;

var NAMESPACE = '/community';

var JOIN_EVENT = 'join';
var LEAVE_EVENT = 'leave';

var JOIN_TOPIC = 'community:join';
var LEAVE_TOPIC = 'community:leave';

function notifyRoom(io, uuid, event, msg) {

  var clientSockets = helper.getUserSocketsFromNamespace(msg.target, io.of(NAMESPACE).sockets);
  if (!clientSockets) {
    return;
  }

  clientSockets.forEach(function(socket) {
    socket.emit(event, msg);
  });
}

function init(io) {
  if (initialized) {
    logger.warn('The notification community service is already initialized');
    return;
  }

  pubsub.topic(JOIN_TOPIC).subscribe(function(msg) {
    notifyRoom(io, null, JOIN_EVENT, msg);
  });

  pubsub.topic(LEAVE_TOPIC).subscribe(function(msg) {
    notifyRoom(io, null, LEAVE_EVENT, msg);
  });

  io.of(NAMESPACE)
    .on('connection', function(socket) {

      logger.info('User', socket.handshake.query.user, ': new connection on ' + NAMESPACE);

      socket.on('subscribe', function(uuid) {
        logger.info('User', socket.handshake.query.user, ': joining room ', NAMESPACE, '/', uuid);
        socket.join(uuid);
      });

      socket.on('unsubscribe', function(uuid) {
        logger.info('User', socket.handshake.query.user, ': leaving room ', NAMESPACE, '/', uuid);
        socket.leave(uuid);
      });
    });

  initialized = true;
}

module.exports.init = init;
