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
      community.getMembers(target.id, null, function(err, members) {
        if (err) {
          return callback(err);
        }
        members.forEach(function(member) {
          users[member.user] = true;
        });
        callback();
      });
    }
  }

  function callback(err) {
    if (err) {
      return;
    }
    for (var user in users) {
      if (users.hasOwnProperty(user)) {
        notify(io, user, event, usernotification);
      }
    }
  }

  async.eachSeries(usernotification.target, filterByUserAndCommunity, callback);
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
