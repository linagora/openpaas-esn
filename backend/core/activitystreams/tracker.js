'use strict';

var logger = require('../logger');
var mongoose = require('mongoose');
var TimelineEntriesTracker = mongoose.model('TimelineEntriesTracker');

/**
 * Create a TimelineEntriesTracker
 *
 * @param {User, ObjectId} userId
 * @param {function} callback fn like callback(err, saved) (saved is the document saved)
 */
function createTimelineEntriesTracker(userId, callback) {
  userId = userId._id || userId;

  var timelineEntriesTracker = {
    _id: userId,
    timelines: {}
  };

  var timelineEntriesTrackerAsModel = new TimelineEntriesTracker(timelineEntriesTracker);
  timelineEntriesTrackerAsModel.save(function(err, saved) {
    if (err) {
      logger.error('Error while saving TimelineEntriesTracker in database:' + err.message);
      return callback(err);
    }
    logger.debug('New TimelineEntriesTracker saved in database:', saved._id);
    return callback(null, saved);
  });
}

/**
 * Change the last TimelineEntry read for the specified document
 *
 * @param {string} activityStreamUuid
 * @param {ObjectId} lastTimelineEntryUsedId
 * @param {TimelineEntriesTracker} doc
 * @param {function} callback fn like callback(err, saved) (saved is the document saved)
 */
function changeLastTimelineEntryRead(activityStreamUuid, lastTimelineEntryUsedId, doc, callback) {
  doc.timelines[activityStreamUuid] = lastTimelineEntryUsedId;
  doc.markModified('timelines');
  doc.save(function(err, saved) {
    if (err) {
      logger.error('Error while saving TimelineEntriesTracker in database:' + err.message);
      return callback(err);
    }
    logger.debug('TimelineEntriesTracker update and saved in database:', saved._id);
    return callback(null, saved);
  });
}

/**
 * Update the last TimelineEntry read by a user in the specified ActivityStream
 *
 * @param {User, ObjectId} userId
 * @param {string} activityStreamUuid
 * @param {TimelineEntry, ObjectId} lastTimelineEntryUsedId
 * @param {function} callback fn like callback(err)
 */
function updateLastTimelineEntryRead(userId, activityStreamUuid, lastTimelineEntryUsedId, callback) {
  userId = userId._id || userId;
  lastTimelineEntryUsedId = lastTimelineEntryUsedId._id || lastTimelineEntryUsedId;

  TimelineEntriesTracker.findById(userId, function(err, doc) {
    if (err) {
      logger.warn('Error while finding by ID a TimelineEntriesTracker : ', +err.message);
      return callback(err);
    }

    if (doc) {
      changeLastTimelineEntryRead(activityStreamUuid, lastTimelineEntryUsedId, doc, function(err, saved) {
        return callback(err, saved);
      });
    }
    else {
      createTimelineEntriesTracker(userId, function(err, saved) {
        if (err) { return callback(err); }
        changeLastTimelineEntryRead(activityStreamUuid, lastTimelineEntryUsedId, saved, function(err, saved) {
          return callback(err, saved);
        });
      });
    }

  });
}

module.exports.updateLastTimelineEntryRead = updateLastTimelineEntryRead;

/**
 * Get the last TimelineEntry read by a user in the specified ActivityStream
 *
 * @param {User, ObjectId} userId
 * @param {string} activityStreamUuid
 * @param {function} callback fn like callback(err, objectId)
 */
function getLastTimelineEntryRead(userId, activityStreamUuid, callback) {
  userId = userId._id || userId;

  TimelineEntriesTracker.findById(userId, function(err, doc) {
    if (err) {
      logger.warn('Error while finding by ID a TimelineEntriesTracker : ', + err.message);
      return callback(err);
    }

    return callback(null, doc && doc.timelines[activityStreamUuid]);
  });
}

module.exports.getLastTimelineEntryRead = getLastTimelineEntryRead;

/**
 * Compute the number of TimelineEntries which are not read since last update
 *
 * @param {User, ObjectId} userId
 * @param {string} activityStreamUuid
 * @param {function} callback fn like callback(err, count) (count is a number)
 */
function getUnreadTimelineEntriesCount(userId, activityStreamUuid, callback) {
  getLastTimelineEntryRead(userId, activityStreamUuid, function(err, lastTimelineEntryRead) {
    if (err) { return callback(err); }

    if (!lastTimelineEntryRead) {
      return callback(null, 0);
    }

    var options = {
      target: {
        objectType: 'activitystream',
        _id: activityStreamUuid
      },
      after: lastTimelineEntryRead,
      stream: true
    };

    var activityStream = require('./');
    activityStream.query(options, function(err, stream) {

      var hash = {};
      stream.on('data', function(doc) {
        if ((doc.actor._id + '') === (userId + '')) {
          hash[doc._id] = false;
        } else if (doc.verb === 'post') {
          hash[doc._id] = true;
        } else if (doc.verb === 'remove') {
          hash[doc._id] = false;
        }
      });

      stream.on('error', function(err) {
        return callback(err);
      });

      stream.on('close', function() {
        var count = 0;
        for (var key in hash) {
          if (hash.hasOwnProperty(key) && hash[key]) {
            count++;
          }
        }

        return callback(null, count);
      });
    });
  });
}

module.exports.getUnreadTimelineEntriesCount = getUnreadTimelineEntriesCount;
