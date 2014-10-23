'use strict';

var pubsub = require('../../core/pubsub').global,
    logger = require('../../core/logger'),
    community = require('../../core/community'),
    helper = require('../helper/socketio'),
    async = require('async');

var initialized = false;

var NAMESPACE = '/usernotifications';

var TOPIC_CREATED = 'usernotification:created';
var TOPIC_UPDATED = 'usernotification:updated';

var NOTIFICATION_EVENT_CREATED = 'created';
var NOTIFICATION_EVENT_UPDATED = 'updated';

var NOTIFICATION_CATEGORIES_FOR_ALL = [
  'external'
];
var NOTIFICATION_CATEGORIES_FOR_MANAGERS = [
  'community:membership:request'
];

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

function isForAll(usernotification) {
  return NOTIFICATION_CATEGORIES_FOR_ALL.indexOf(usernotification.category) >= 0;
}

function isForManagers(usernotification) {
  return NOTIFICATION_CATEGORIES_FOR_MANAGERS.indexOf(usernotification.category) >= 0;
}

function addUsersToCache(err, users, finds, callback) {
  if (err) {
    return callback(err);
  }
  finds.forEach(function(member) {
    users[member.user] = true;
  });
  return callback();
}

function handler(io, event, usernotification) {
  if (usernotification.parentId) {
    return;
  }
  var users = {};

  function filterByUserAndCommunity(target, callback) {
    if (target.objectType === 'user') {
      users[target.id] = true;
      callback();
    } else if (target.objectType === 'community') {
      if (isForAll(usernotification)) {
        community.getMembers(target.id, null, function(err, members) {
          addUsersToCache(err, users, members, callback);
        });
      } else if (isForManagers(usernotification)) {
        community.getManagers(target.id, null, function(err, managers) {
          addUsersToCache(err, users, managers, callback);
        });
      }
    }
  }

  function onEndOfSeries(err) {
    if (err) {
      return;
    }
    for (var user in users) {
      if (users.hasOwnProperty(user)) {
        notify(io, user, event, usernotification);
      }
    }
  }

  async.eachSeries(usernotification.target, filterByUserAndCommunity, onEndOfSeries);
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

  initialized = true;
}

module.exports.init = init;
