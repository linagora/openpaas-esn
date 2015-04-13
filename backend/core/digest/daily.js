'use strict';

var q = require('q');

var collaborationModule = require('../collaboration');
var messageModule = require('../message');
var userModule = require('../user');
var activitystreamsModule = require('../activitystreams');
var tracker = require('../activitystreams/tracker');
var readTracker = tracker.getTracker('read');
var pushTracker = tracker.getTracker('push');
var weight = require('./weight');

function setReadFlags(message) {

  function isInThread(originalResponse) {
    for (var i = 0; i < message.thread.responses.length; i++) {
      if (originalResponse._id + '' === message.thread.responses[i].message._id + '') {
        return true;
      }
    }
    return false;
  }

  function flagReadResponse(originalResponse) {
    if (!message.thread.responses || message.thread.responses.length === 0) {
      originalResponse.read = true;
    } else {
      originalResponse.read = !isInThread(originalResponse);
    }
  }

  if (message.original.responses && message.original.responses.length > 0) {
    message.original.responses.forEach(flagReadResponse);
  }

  message.original.read = message.thread.responses.length !== 0;

  return q(message);
}
module.exports.setReadFlags = setReadFlags;

function buildMessageContext(thread) {
  if (!thread) {
    return q.reject(new Error('Thread is required'));
  }

  function process(message) {
    return setReadFlags(message).then(function(result) {
      return result.original;
    });
  }

  return q.nfcall(messageModule.get, thread.message._id).then(
    function(message) {
      return process({
        original: message,
        thread: thread
      });
    },
    function(err) {
      return process({
        original: {},
        thread: thread,
        status: err.message
      });
    }
  );
}
module.exports.buildMessageContext = buildMessageContext;

function getMostRecentTimelineEntry(timelineEntryId1, timelineEntryId2) {

  if (!timelineEntryId1 && !timelineEntryId2) {
    return q();
  }

  if (!timelineEntryId1 && timelineEntryId2) {
    return q(timelineEntryId2);
  }

  if (!timelineEntryId2 && timelineEntryId1) {
    return q(timelineEntryId1);
  }

  return q.spread([q.nfcall(activitystreamsModule.getTimelineEntry, timelineEntryId1), q.nfcall(activitystreamsModule.getTimelineEntry, timelineEntryId2)],
    function(timelineEntry1, timelineEntry2) {
      if (!timelineEntry1 && !timelineEntry2) {
        return;
      }

      if (!timelineEntry1) {
        return timelineEntryId2;
      }

      if (!timelineEntry2) {
        return timelineEntryId1;
      }

      return timelineEntry1.published > timelineEntry2.published ? timelineEntryId1 : timelineEntryId2;
    });
}
module.exports.getMostRecentTimelineEntry = getMostRecentTimelineEntry;

// if push date > read date skip
// if read date > push date -> get all message since read date
// if read date && !push date -> get all messages since read date
// if !read date && ! push date -> not tracked, we have to check the collaboration and load all messages


function getTracker(user, collaboration) {

  if (!user || !collaboration) {
    return q.reject(new Error('User and collaboration are required'));
  }

  return q.spread([q.nfcall(readTracker.getLastTimelineEntry, user, collaboration.activity_stream.uuid), q.nfcall(pushTracker.getLastTimelineEntry, user, collaboration.activity_stream.uuid)],
    function(read, push) {
      return getMostRecentTimelineEntry(read, push).then(function(result) {
        return !result || result === read ? readTracker : pushTracker;
      });
    });
}
module.exports.getTracker = getTracker;

function loadUserDataForCollaboration(user, collaboration) {

  if (!user || !collaboration) {
    return q.reject(new Error('User and collaboration are required'));
  }

  return getTracker(user, collaboration).then(function(tracker) {
    return q.nfcall(tracker.buildThreadViewSinceLastTimelineEntry, user._id, collaboration.activity_stream.uuid).then(function(threads) {
      if (!threads) {
        return q({
          messages: [],
          collaboration: collaboration
        });
      }

      var messagesContext = [];
      Object.keys(threads).forEach(function(messageId) {
        messagesContext.push(buildMessageContext(threads[messageId]));
      });

      return q.all(messagesContext).then(function(context) {
        return {
          messages: context,
          collaboration: collaboration
        };
      });
    });
  });
}
module.exports.loadUserDataForCollaboration = loadUserDataForCollaboration;

function userDailyDigest(user) {
  if (!user) {
    return q.reject(new Error('User is required'));
  }

  return q.nfcall(collaborationModule.getCollaborationsForTuple, {
    id: user._id,
    objectType: 'user'
  }).then(function(collaborations) {

    if (!collaborations || collaborations.length === 0) {
      return q({user: user, data: [], status: 'No collaborations found'});
    }

    var collaborationData = collaborations.map(function(collaboration) {
      // TODO : Tracker
      return loadUserDataForCollaboration(user, collaboration);
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
