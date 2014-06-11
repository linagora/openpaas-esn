'use strict';

var pubsub = require('../../core/pubsub').global,
    logger = require('../../core/logger'),
    i18n = require('../../i18n');

/*
- created => la conférence a été créée
- join => :user a rejoint la conférence
- leave => :user a quitté la conférence
- muted => :user a muté son microhpone
- unmuted => :user a unmuté son microphone
- refused => :user a refusé de participer à la conférence
- invited[:attendee] => !user a invité :attendee dans la conférence
*/

var initialized = false;

var NAMESPACE = '/conferences';

var NOTIFICATION_EVENT = 'notification';
var INVITATION_EVENT = 'invitation';

var JOINER_TOPIC = 'conference:join';
var LEAVER_TOPIC = 'conference:leave';
var CALLEE_TOPIC = 'conference:invited';

var clients = [];

function notifyRoom(io, uuid, msg) {
  io.of(NAMESPACE)
    . in (uuid)
    .emit(NOTIFICATION_EVENT, msg);
}

function notifyCallee(io, callee, msg) {
  io.of(NAMESPACE)
    .sockets[clients[callee]]
    .emit(INVITATION_EVENT, msg);
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
    msg.message = i18n.__('%s has joined the conference', msg.user_id);
    notifyRoom(io, msg.conference_id, msg);
  });

  pubsub.topic(LEAVER_TOPIC).subscribe(function(msg) {
    msg.message = i18n.__('%s has left the conference', msg.user_id);
    notifyRoom(io, msg.conference_id, msg);
  });

  io.of(NAMESPACE)
    .on('connection', function(socket) {
      var client = {
        user: socket.handshake.query.user,
        token: socket.handshake.query.token,
        address: socket.handshake.address.address,
        port: socket.handshake.address.port
      };

      logger.info('New connection on /conferences', client);

      clients[client.user] = socket.id;

      socket.on('subscribe', function(uuid) {
        logger.info('Joining room', uuid, client);
        socket.join(uuid);
      });

      socket.on('unsubscribe', function(uuid) {
        logger.info('Leaving room', uuid, client);
        socket.leave(uuid);
      });
    });

  initialized = true;
}

module.exports.init = init;
