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

      function resolved() {
        return _resolve(data);
      }

      var updates = data.map(function(element) {
        var stream = element.collaboration.activity_stream;

        logger.debug('Updating tracker on stream %s for user %s', stream.uuid, user._id);
        return getLastTimelineEntry(element.messages, stream).then(
          function(lastEntry) {
            if (!lastEntry) {
              logger.debug('Can not find the last timelineentry on stream %s for user %s', stream.uuid, user._id);
              return resolved();
            }

            return updateLastTimelineEntry(user._id, stream.uuid, lastEntry).then(resolved, resolved);
          },
          function(err) {
            logger.debug('Error while getting last timeline entry on stream %s for user %s', stream.uuid, user._id, err);
            return resolved();
          }
        );
      });

      return q.all(updates);
    }

    return createTrackerIfNeeded(user).then(update);
  }

  return {
    updateTracker: updateTracker
  };
};
