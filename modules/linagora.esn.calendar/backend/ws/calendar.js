'use strict';

var initialized = false;
var NAMESPACE = '/calendars';
var PUBSUB_EVENT = 'calendar:event:updated';
var CONSTANTS = require('../lib/constants');
var WS_EVENT = CONSTANTS.WS_EVENT;
var NOTIFICATIONS = CONSTANTS.NOTIFICATIONS;
var ICAL = require('ical.js');
var _ = require('lodash');

function parseEventPath(eventPath) {
  // The eventPath is in this form : /calendars/{{userId}}/calendarId/{{eventUid}}
  var pathParts = eventPath.replace(/^\//, '').split('/');

  return {
    userId: pathParts[1],
    calendarId: pathParts[2],
    eventUid: pathParts[3].replace(/\.ics$/, '')
  };
}

function parseUserPrincipal(userPrincipal) {
  // The userPrincipal is in this form : principals/users/{{userId}}
  var pathParts = userPrincipal.split('/');

  return pathParts[2];
}

function notify(io, ioHelper, event, msg) {
  var userIds = [parseEventPath(msg.eventPath).userId];

  if (msg.shareeIds) {
    msg.shareeIds.forEach(function(shareePrincipals) {
      userIds.push(parseUserPrincipal(shareePrincipals));
    });
  }

  delete msg.shareeIds;

  userIds.forEach(function(userId) {
    var clientSockets = ioHelper.getUserSocketsFromNamespace(userId, io.of(NAMESPACE).sockets) || [];
    _.invokeMap(clientSockets, 'emit', event, msg);
  });
}

function emitElasticSearchEvent(pubsub, msg) {
  var data = parseEventPath(msg.eventPath);
  var action = msg.websocketEvent;

  data.ics = (new ICAL.Component(msg.event)).toString();

  if (action === WS_EVENT.EVENT_CREATED || action === WS_EVENT.EVENT_REQUEST) {
    pubsub.local.topic(NOTIFICATIONS.EVENT_ADDED).publish(data);
  } else if (action === WS_EVENT.EVENT_UPDATED || action === WS_EVENT.EVENT_REPLY) {
    pubsub.local.topic(NOTIFICATIONS.EVENT_UPDATED).publish(data);
  } else if (action === WS_EVENT.EVENT_DELETED || action === WS_EVENT.EVENT_CANCEL) {
    pubsub.local.topic(NOTIFICATIONS.EVENT_DELETED).publish(data);
  } else {
    throw new Error('Unknow ws_event for calendar CRUD', action);
  }
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
    pubsub.local.topic(PUBSUB_EVENT).publish(msg);
    notify(io, ioHelper, msg.websocketEvent, msg);
    emitElasticSearchEvent(pubsub, msg);
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
