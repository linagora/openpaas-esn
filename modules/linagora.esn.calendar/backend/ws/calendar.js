'use strict';

var initialized = false;
var NAMESPACE = '/calendars';
var PUBSUB_EVENT = 'calendar:event:updated';

function notify(io, ioHelper, event, msg) {
  //eventPath = /calendars/{{userId}}/calendarId/{{eventId}}
  var id = msg.eventPath.replace(/^\//, '').split('/')[1];
  var clientSockets = ioHelper.getUserSocketsFromNamespace(id, io.of(NAMESPACE).sockets) || [];

  clientSockets.forEach(function(socket) {
    socket.emit(event, msg);
  });
}

function init(dependencies) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub');
  var io = dependencies('wsserver').io;
  var ioHelper = dependencies('wsserver').ioHelper;

  if (initialized) {
    logger.warn('The calendar notification service is already initialized');
    return;
  }

  pubsub.global.topic(PUBSUB_EVENT).subscribe(function(msg) {
    notify(io, ioHelper, msg.websocketEvent, msg);
  });

  io.of(NAMESPACE)
    .on('connection', function(socket) {
      logger.info('New connection on ' + NAMESPACE);

      socket.on('subscribe', function(uuid) {
        logger.info('Joining room', uuid);
        socket.join(uuid);
      });

      socket.on('unsubscribe', function(uuid) {
        logger.info('Leaving room', uuid);
        socket.leave(uuid);
      });
    });
  initialized = true;
}

module.exports.init = init;
