'use strict';

var pubsub = require('../../core/pubsub').global,
  logger = require('../../core/logger'),
  helper = require('../helper/socketio'),
  async = require('async');

var initialized = false;

var TOPIC = 'notification:api';
var NAMESPACE = '/notifications';
var NOTIFICATION_EVENT = 'notification';

function notify(io, user, notification) {
  var clientSockets = helper.getUserSocketsFromNamespace(user, io.of(NAMESPACE).sockets);
  if (!clientSockets) {
    return;
  }
  logger.debug('notify for notification', user, ', found', clientSockets.length, 'websockets');
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
    if (notification.parent) {
      return;
    }
    var users = {};

    async.eachSeries(notification.target, function(target, callback) {
      if (target.objectType === 'user') {
        users[target.id] = true;
        callback();
      }
    }, function(err) {
      if (err) {
        return;
      }

      Object.keys(users).forEach(function(user) {
        notify(io, user, notification);
      });
    });
  });

  io.of(NAMESPACE).on('connection', function(socket) {
    var userId = helper.getUserId(socket);
    logger.info('User', userId, ': new connection on ' + NAMESPACE);

    socket.on('subscribe', function(uuid) {
      logger.info('User', userId, ': joining room /', NAMESPACE, '/', uuid);
      socket.join(uuid);
    });

    socket.on('unsubscribe', function(uuid) {
      logger.info('User', userId, ': leaving room /', NAMESPACE, '/', uuid);
      socket.leave(uuid);
    });
  });
  initialized = true;
}

module.exports.init = init;
