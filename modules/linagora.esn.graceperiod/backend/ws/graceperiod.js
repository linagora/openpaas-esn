'use strict';

var initialized = false;
var NAMESPACE = '/graceperiod';
var graceNamespace;

function init(lib, dependencies) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').local;
  var io = dependencies('wsserver').io;
  var helper = dependencies('wsserver').ioHelper;

  var GRACEPERIOD_ERROR = lib.constants.GRACEPERIOD_ERROR;
  var GRACEPERIOD_DONE = lib.constants.GRACEPERIOD_DONE;

  function notify(event, data) {
    if (!data.user) {
      logger.debug('No user found in notification, can not forward to clients');
      return;
    }
    var user = data.user + '';
    var clientSockets = helper.getUserSocketsFromNamespace(user, io.of(NAMESPACE).sockets);
    if (!clientSockets) {
      logger.debug('No client found for graceperiod event');
      return;
    }
    logger.debug('notify for graceperiod', user, ', found', clientSockets.length, 'websockets');
    clientSockets.forEach(function(socket) {
      socket.emit(event, data);
    });
  }

  if (initialized) {
    logger.warn('The graceperiod notification service is already initialized');
    return;
  }

  logger.info('Starting grace period live notification');

  pubsub.topic(GRACEPERIOD_ERROR).subscribe(function(data) {
    logger.info('Notifying grace period error');
    notify(GRACEPERIOD_ERROR, data);
  });

  pubsub.topic(GRACEPERIOD_DONE).subscribe(function(data) {
    logger.info('Notifying grace period done');
    notify(GRACEPERIOD_DONE, data);
  });

  graceNamespace = io.of(NAMESPACE);
  graceNamespace.on('connection', function(socket) {
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
