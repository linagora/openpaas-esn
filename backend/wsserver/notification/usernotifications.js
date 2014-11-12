'use strict';

var pubsub = require('../../core/pubsub').global,
    logger = require('../../core/logger'),
    helper = require('../helper/socketio');

var initialized = false;

var NAMESPACE = '/usernotification';

var TOPIC_CREATED = 'usernotification:created';
var TOPIC_UPDATED = 'usernotification:updated';

var NOTIFICATION_EVENT_CREATED = 'usernotification:created';
var NOTIFICATION_EVENT_UPDATED = 'usernotification:updated';


function notify(io, user, event, usernotification) {
  var clientSockets = helper.getUserSocketsFromNamespace(user, io.of(NAMESPACE).sockets);
  if (!clientSockets) {
    return;
  }
  logger.debug('notify for usernotification', user, ', found', clientSockets.length, 'websockets');
  clientSockets.forEach(function(socket) {
    socket.emit(event, usernotification);
  });
}

function handler(io, event, usernotification) {
  notify(io, usernotification.target, event, usernotification);
}

function init(io) {
  if (initialized) {
    logger.warn('The user notifications event service is already initialized');
    return;
  }

  pubsub.topic(TOPIC_CREATED).subscribe(function(usernotification) {
    handler(io, NOTIFICATION_EVENT_CREATED, usernotification);
  });
  pubsub.topic(TOPIC_UPDATED).subscribe(function(usernotification) {
    handler(io, NOTIFICATION_EVENT_UPDATED, usernotification);
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
