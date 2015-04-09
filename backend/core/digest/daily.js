'use strict';

var q = require('q');

var collaborationModule = require('../collaboration');
var messageModule = require('../message');
var userModule = require('../user');
var tracker = require('../activitystreams/tracker');
var readTracker = tracker.getTracker('read');
var pushTracker = tracker.getTracker('push');
var weight = require('./weight');

function createMessageContext(thread) {
  if (!thread) {
    return q.reject(new Error('Thread is required'));
  }

  return q.nfcall(messageModule.dryGet, thread.message._id).then(
    function(message) {
      return {
        original: message,
        thread: thread
      };
    },
    function(err) {
      return {
        original: {},
        thread: thread,
        status: err.message
      };
    }
  );
}
module.exports.createMessageContext = createMessageContext;

function loadUserDataForCollaboration(user, collaboration, tracker) {

  if (!user || !collaboration || !tracker) {
    return q.reject(new Error('User, collaboration and tracker are required'));
  }

  var userId = user._id;
  var uuid = collaboration.activity_stream.uuid;

  return q.nfcall(tracker.buildThreadViewSinceLastTimelineEntry, userId, uuid).then(function(threads) {
    if (!threads) {
      return q({});
    }

    var messagesContext = [];
    Object.keys(threads).forEach(function(messageId) {
      messagesContext.push(createMessageContext(threads[messageId]));
    });

    return q.all(messagesContext).then(function(context) {
      return {
        messages: context,
        collaboration: {_id: collaboration._id, activity_stream: collaboration.activity_stream}
      };
    });
  });
}
module.exports.loadUserDataForCollaboration = loadUserDataForCollaboration;

function userDailyDigest(user) {
  if (!user) {
    return q.reject(new Error('User is required'));
  }

  return q.nfcall(collaborationModule.getCollaborationsForTuple, {id: user._id, objectType: 'user'}).then(function(collaborations) {

    if (!collaborations || collaborations.length === 0) {
      return q({user: user, data: [], status: 'No collaborations found'});
    }

    var collaborationData = collaborations.map(function(collaboration) {
      // TODO : Tracker
      return loadUserDataForCollaboration(user, collaboration, readTracker);
    });

    function send(data) {
      // TODO, really send digest
      return data;
    }

    function processUserData(data) {
      return q.all(data.map(function(d) {
        return weight.compute(user, d);
      }));
    }

    function updateTrackers(data) {
      // TODO : Update the push tracker
      return data;
    }

    return q.all(collaborationData)
      .then(processUserData)
      .then(send)
      .then(updateTrackers).then(function(data) {
        return q({user: user, data: data});
      });
  });
}
module.exports.userDailyDigest = userDailyDigest;

function digest() {
  return q.nfcall(userModule.list).then(function(users) {
    if (!users || users.length === 0) {
      return [];
    }

    var digests = users.map(function(user) {
      return userDailyDigest(user);
    });
    return q.all(digests);
  });
}
module.exports.digest = digest;
