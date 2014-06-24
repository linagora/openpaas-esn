'use strict';

var core = require('../../core'),
    pubsub = core.pubsub.global,
    logger = core.logger,
    userModule = core.user,
    i18n = require('../../i18n'),
    helper = require('../helper/socketio');

var initialized = false;

var NAMESPACE = '/conferences';

var NOTIFICATION_EVENT = 'notification';
var INVITATION_EVENT = 'invitation';

var JOINER_TOPIC = 'conference:join';
var LEAVER_TOPIC = 'conference:leave';
var CALLEE_TOPIC = 'conference:invite';

function notifyRoom(io, uuid, msg) {
  io.of(NAMESPACE)
    . in (uuid)
    .emit(NOTIFICATION_EVENT, msg);
}

function notifyCallee(io, callee, msg) {
  var clientSockets = helper.getUserSocketsFromNamespace(callee, io.of(NAMESPACE).sockets);
  logger.debug('notifyCallee', callee, ', found', clientSockets.length, 'websockets');
  if (!clientSockets) {
    return;
  }
  clientSockets.forEach(function(socket) {
    socket.emit(INVITATION_EVENT, msg);
  });
}

function init(io) {
  if (initialized) {
    logger.warn('The notification conferences service is already initialized');
    return;
  }

  pubsub.topic(CALLEE_TOPIC).subscribe(function(msg) {
    var callee = msg.user_id;
    notifyCallee(io, callee, msg);
  });

  pubsub.topic(JOINER_TOPIC).subscribe(function(msg) {
    userModule.get(msg.user_id, function(err, user) {
      if (!err && user) {
        msg.message = i18n.__('%s has joined the conference', user.firstname + ' ' + user.lastname);
        notifyRoom(io, msg.conference_id, msg);
      }
    });
  });

  pubsub.topic(LEAVER_TOPIC).subscribe(function(msg) {
    userModule.get(msg.user_id, function(err, user) {
      if (!err && user) {
        msg.message = i18n.__('%s has left the conference', user.firstname + ' ' + user.lastname);
        notifyRoom(io, msg.conference_id, msg);
      }
    });
  });

  io.of(NAMESPACE)
    .on('connection', function(socket) {

      logger.info('User', socket.handshake.query.user, ': new connection on /conferences');

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
