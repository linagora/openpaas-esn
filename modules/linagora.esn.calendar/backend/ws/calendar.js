'use strict';

const {EVENTS, WEBSOCKET} = require('../lib/constants');
const _ = require('lodash');
let initialized = false;

module.exports = {
  init
};

function init(dependencies) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const io = dependencies('wsserver').io;
  const ioHelper = dependencies('wsserver').ioHelper;

  if (initialized) {
    logger.warn('The calendar notification service is already initialized');

    return;
  }

  _.forOwn(EVENTS.EVENT, topic => {
    logger.debug('Subscribing to global topic', topic);
    pubsub.global.topic(topic).subscribe(msg => {
      logger.debug('Received a message on', topic);
      pubsub.local.topic(topic).publish(msg);
      notify(topic, msg);
    });
  });

  io.of(WEBSOCKET.NAMESPACE)
    .on('connection', socket => {
      logger.info('New connection on', WEBSOCKET.NAMESPACE);

      socket.on('subscribe', uuid => {
        logger.info('Joining room', uuid);
        socket.join(uuid);
      });

      socket.on('unsubscribe', uuid => {
        logger.info('Leaving room', uuid);
        socket.leave(uuid);
      });
    });
  initialized = true;

  function notify(topic, msg) {
    const userIds = [parseEventPath(msg.eventPath).userId];

    if (msg.shareeIds) {
      msg.shareeIds.forEach(shareePrincipals => userIds.push(parseUserPrincipal(shareePrincipals)));
    }

    delete msg.shareeIds;

    userIds.forEach(userId => {
      const clientSockets = ioHelper.getUserSocketsFromNamespace(userId, io.of(WEBSOCKET.NAMESPACE).sockets) || [];

      _.invokeMap(clientSockets, 'emit', topic, msg);
    });
  }
}

function parseEventPath(eventPath) {
  // The eventPath is in this form : /calendars/{{userId}}/calendarId/{{eventUid}}
  const pathParts = eventPath.replace(/^\//, '').split('/');

  return {
    userId: pathParts[1],
    calendarId: pathParts[2],
    eventUid: pathParts[3].replace(/\.ics$/, '')
  };
}

function parseUserPrincipal(userPrincipal) {
  // The userPrincipal is in this form : principals/users/{{userId}}
  const pathParts = userPrincipal.split('/');

  return pathParts[2];
}
