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
  var mail = require('./mail')(dependencies);
  var trackerUpdater = require('./tracker')(dependencies);

  return {

    setReadAndInvolvedFlags: function(message, thread, user) {
      // If thread.read is undefined then the message is read
      message.read = !('read' in thread) || thread.read;
      message.involved = message.author && message.author._id + '' === user._id + '' ? true : false;

      if (!arrayHelper.isNullOrEmpty(message.responses)) {
        message.responses.forEach(function(messageResponse) {

          if (!arrayHelper.isNullOrEmpty(thread.responses)) {
            // Find the response with the same id in the thread responses array and init the read field
            thread.responses.some(function(threadResponse) {
              if (threadResponse.message && messageResponse._id + '' === threadResponse.message._id + '') {
                messageResponse.read = threadResponse.read;
                return true;
              } else {
                messageResponse.read = true;
                return false;
              }
            });
          } else {
            messageResponse.read = true;
          }

          // Check involvement
          if (messageResponse.author && messageResponse.author._id + '' === user._id + '') {
            message.involved = true;
          }
        });
      }

      return q(message);
    },

    buildMessageContext: function(thread, user) {
      if (!thread || !user) {
        return q.reject(new Error('Thread and user is required'));
      }

      var self = this;

      return q.nfcall(messageModule.get, thread.message._id).then(
        function(message) {
          return self.setReadAndInvolvedFlags(message, thread, user);
        },
        function(err) {
          logger.error('Daily digest error when retrieving message from database, skip message', err);
          return q({});
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
            messagesContext.push(self.buildMessageContext(threads[messageId], user));
          });

          return q.all(messagesContext).then(function(messages) {
            return {
              messages: messages.filter(function(message) {
                // Do not put !message.involved because if message.involved is undefined it must return false
                return message && message.involved === false;
              }),
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
          return q.resolve({user: user, data: [], status: 'No collaborations found'});
        }

        var collaborationData = collaborations.map(function(collaboration) {
          return self.loadUserDataForCollaboration(user, collaboration);
        });

        function sendDigest(data) {
          logger.info('Sending digest to user %s %s', user._id.toString(), user.emails[0]);
          return mail.process(user, data).then(function() {
            return data;
          });
        }

        function processUserData(data) {
          logger.info('Processing data for user %s %s', user._id.toString(), user.emails[0]);
          return q.all(data.map(function(d) {
            return weight.compute(user, d);
          }));
        }

        function sendFailure(err) {
          logger.error('Failed to send digest for user %s', user._id, err.stack);
          return q.reject(err);
        }

        function updateTrackers(data) {
          return trackerUpdater.updateTracker(user, data);
        }

        return q.all(collaborationData)
          .then(processUserData)
          .then(sendDigest)
          .then(updateTrackers, sendFailure)
          .then(function(data) {
            return {user: user, data: data};
          }, function(err) {
            logger.error('Error occured while processing daily digest for user %s', user._id, err);
            return {user: user, err: err};
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
