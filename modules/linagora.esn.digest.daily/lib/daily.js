'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var collaborationModule = dependencies('collaboration');
  var messageModule = dependencies('message');
  var userModule = dependencies('user');
  var activitystreamsModule = dependencies('activitystreams');
  var arrayHelper = dependencies('helpers').array;

  var tracker = activitystreamsModule.tracker;
  var readTracker = tracker.getTracker('read');
  var pushTracker = tracker.getTracker('push');
  var weight = require('./weight')(dependencies);
  var job = require('./job')(dependencies);

  return {

    setReadFlags: function(message) {

      function isInThread(originalResponse) {
        return message.thread.responses.some(function(response) {
          return originalResponse._id + '' === response.message._id + '';
        });
      }

      function flagReadResponse(originalResponse) {
        originalResponse.read = arrayHelper.isNullOrEmpty(message.thread.responses) || !isInThread(originalResponse);
      }

      if (!arrayHelper.isNullOrEmpty(message.original.responses)) {
        message.original.responses.forEach(flagReadResponse);
      }

      message.original.read = message.thread.responses ? message.thread.responses.length !== 0 : false;
      return q(message);
    },

    buildMessageContext: function(thread) {
      if (!thread) {
        return q.reject(new Error('Thread is required'));
      }

      var self = this;

      function process(message) {
        return self.setReadFlags(message).then(function(result) {
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
    },

    getMostRecentTimelineEntry: function(timelineEntryId1, timelineEntryId2) {

      if (!timelineEntryId1 && !timelineEntryId2) {
        return q();
      }

      if (!timelineEntryId1 && timelineEntryId2) {
        return q(timelineEntryId2);
      }

      if (!timelineEntryId2 && timelineEntryId1) {
        return q(timelineEntryId1);
      }

      var _getTimelineEntry = q.denodeify(activitystreamsModule.getTimelineEntry);
      return q.spread([_getTimelineEntry(timelineEntryId1), _getTimelineEntry(timelineEntryId2)],
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
    },

    getTracker: function(user, collaboration) {
      if (!user || !collaboration) {
        return q.reject(new Error('User and collaboration are required'));
      }

      var self = this;

      var readTrackerGetLastTimelineEntry = q.denodeify(readTracker.getLastTimelineEntry);
      var pushTrackerGetLastTimelineEntry = q.denodeify(pushTracker.getLastTimelineEntry);

      return q.spread([
        readTrackerGetLastTimelineEntry(user, collaboration.activity_stream.uuid),
        pushTrackerGetLastTimelineEntry(user, collaboration.activity_stream.uuid)
      ], function(read, push) {
        return self.getMostRecentTimelineEntry(read, push).then(function(result) {
          return !result || result === read ? readTracker : pushTracker;
        });
      });
    },

    loadUserDataForCollaboration: function(user, collaboration) {

      if (!user || !collaboration) {
        return q.reject(new Error('User and collaboration are required'));
      }

      var self = this;

      return this.getTracker(user, collaboration).then(function(tracker) {
        return q.nfcall(tracker.buildThreadViewSinceLastTimelineEntry, user._id, collaboration.activity_stream.uuid).then(function(threads) {
          if (!threads) {
            return q({
              messages: [],
              collaboration: collaboration
            });
          }

          var messagesContext = [];
          Object.keys(threads).forEach(function(messageId) {
            messagesContext.push(self.buildMessageContext(threads[messageId]));
          });

          return q.all(messagesContext).then(function(context) {
            return {
              messages: context,
              collaboration: collaboration
            };
          });
        });
      });
    },

    userDailyDigest: function(user) {
      if (!user) {
        return q.reject(new Error('User is required'));
      }

      var self = this;

      logger.info('Processing daily digest for user', user._id.toString(), user.emails[0]);

      return q.nfcall(collaborationModule.getCollaborationsForTuple, {
        id: user._id,
        objectType: 'user'
      }).then(function(collaborations) {

        if (!collaborations || collaborations.length === 0) {
          return q({user: user, data: [], status: 'No collaborations found'});
        }

        var collaborationData = collaborations.map(function(collaboration) {
          return self.loadUserDataForCollaboration(user, collaboration);
        });

        function send(data) {
          logger.info('Sending digest to user', user._id.toString(), user.emails[0]);
          return job.process(user, data);
        }

        function processUserData(data) {
          logger.info('Processing data for user', user._id.toString(), user.emails[0]);
          return q.all(data.map(function(d) {
            return weight.compute(user, d);
          }));
        }

        function updateTrackers(data) {
          logger.info('Updating push tracker for user', user._id.toString(), user.emails[0]);
          // TODO : Update the push tracker
          return data;
        }

        return q.all(collaborationData)
          .then(processUserData)
          .then(send)
          .then(updateTrackers)
          .then(function(data) {
            return q({user: user, data: data});
          });
      });
    },

    digest: function() {
      logger.info('Running the digest');
      var self = this;
      return q.nfcall(userModule.list).then(function(users) {
        return q.all((users || []).map(self.userDailyDigest.bind(self)));
      });
    }
  };
};
