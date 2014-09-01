'use strict';

var pubsub = require('../../core/pubsub').global,
    logger = require('../../core/logger');

var initialized = false;

var NAMESPACE = '/activitystreams';

var NOTIFICATION_EVENT = 'notification';

var topics = [
  'message:activity'
];

function notify(io, uuids, msg) {
  uuids.forEach(function(uuid) {
    io.of(NAMESPACE)
      . in (uuid)
      .emit(NOTIFICATION_EVENT, {room: uuid, data: msg});
  });
}

function init(io) {
  if (initialized) {
    logger.warn('The notification activitystream service is already initialized');
    return;
  }

  topics.forEach(function(topic) {
    pubsub.topic(topic).subscribe(function(msg) {
      var uuids = msg.target.filter(function(share) {
        return share.objectType === 'activitystream';
      }).map(function(share) {
        return share._id;
      });
      notify(io, uuids, msg);
    });
  });

  io.of(NAMESPACE)
    .on('connection', function(socket) {
      var client = {
        user: socket.handshake.query.user,
        token: socket.handshake.query.token,
        address: socket.handshake.address.address,
        port: socket.handshake.address.port
      };

      logger.info('New connection on ' + NAMESPACE, client);
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
