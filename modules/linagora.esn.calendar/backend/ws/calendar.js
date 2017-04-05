'use strict';

const NAMESPACE = '/calendars';
const CONSTANTS = require('../lib/constants');
const PUBSUB_EVENT = CONSTANTS.EVENTS.TOPIC.EVENT;
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

  pubsub.global.topic(PUBSUB_EVENT).subscribe(msg => {
    pubsub.local.topic(PUBSUB_EVENT).publish(msg);
    notify(io, ioHelper, msg.websocketEvent, msg);
  });

  io.of(NAMESPACE)
    .on('connection', socket => {
      logger.info('New connection on ' + NAMESPACE);

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

function notify(io, ioHelper, event, msg) {
  const userIds = [parseEventPath(msg.eventPath).userId];

  if (msg.shareeIds) {
    msg.shareeIds.forEach(shareePrincipals => userIds.push(parseUserPrincipal(shareePrincipals)));
  }

  delete msg.shareeIds;

  userIds.forEach(userId => {
    const clientSockets = ioHelper.getUserSocketsFromNamespace(userId, io.of(NAMESPACE).sockets) || [];

    _.invokeMap(clientSockets, 'emit', event, msg);
  });
}
