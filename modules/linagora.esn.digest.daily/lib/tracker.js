'use strict';

var q = require('q');
var helpers = require('./helpers');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var activitystreamsModule = dependencies('activitystreams');
  var tracker = activitystreamsModule.tracker;
  var pushTracker = tracker.getTracker('push');

  function _resolve(data) {
    return q.resolve(data);
  }

  function getLastTimelineEntry(messages, activitystream) {
    if (!messages || messages.length === 0) {
      return _resolve();
    }

    if (!activitystream) {
      return _resolve();
    }

    var mostRecent = helpers.getMostRecentMessage(messages);
    if (!mostRecent) {
      return _resolve();
    }

    return q.denodeify(activitystreamsModule.getTimelineEntryFromStreamMessage)(activitystream, mostRecent);
  }

  function createTrackerIfNeeded(user) {
    var trackerExists = q.denodeify(pushTracker.exists);
    var createTimelineEntriesTracker = q.denodeify(pushTracker.createTimelineEntriesTracker);

    return trackerExists(user).then(function(result) {
      if (!result) {
        return createTimelineEntriesTracker(user);
      }
      return _resolve();
    }, function(err) {
      logger.warning('Problem while creating the timelineentry tracker for user %s', user._id, err);
      return _resolve();
    });
  }

  function updateTracker(user, data) {

    if (!user) {
      return q.reject(new Error('User is required'));
    }

    if (!data) {
      return q.reject(new Error('Data is required'));
    }

    logger.info('Updating push tracker for user %s %s', user._id.toString(), user.emails[0]);

    function update() {
      var updateLastTimelineEntry = q.denodeify(pushTracker.updateLastTimelineEntry);

      var updates = data.map(function(element) {
        return getLastTimelineEntry(element.messages, element.collaboration.activity_stream).then(function(lastEntry) {
          if (!lastEntry) {
            return _resolve(data);
          }

          return updateLastTimelineEntry(user._id, element.collaboration.activity_stream.uuid, lastEntry).then(function() {
            return _resolve(data);
          }, function() {
            return _resolve(data);
          });
        }, function() {
          return _resolve(data);
        });
      });

      return q.all(updates);
    }

    return createTrackerIfNeeded(user).then(update);
  }

  return {
    updateTracker: updateTracker
  };

};
