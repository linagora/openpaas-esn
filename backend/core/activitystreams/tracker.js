'use strict';

var logger = require('../logger');
var mongoose = require('mongoose');
var TimelineEntriesTracker = mongoose.model('TimelineEntriesTracker');
var q = require('q');


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
 * @param {TimelineEntry, ObjectId} lastTimelineEntryReadId
 * @param {function} callback fn like callback(err, saved) (saved is the document saved)
 */
function updateLastTimelineEntryRead(userId, activityStreamUuid, lastTimelineEntryReadId, callback) {
  if (!userId) {
    return callback(new Error('User is required'));
  }
  if (!activityStreamUuid) {
    return callback(new Error('Activity Stream UUID is required'));
  }
  if (!lastTimelineEntryReadId) {
    return callback(new Error('Last Timeline Entry read ID is required'));
  }

  userId = userId._id || userId;
  lastTimelineEntryReadId = lastTimelineEntryReadId._id || lastTimelineEntryReadId;

  TimelineEntriesTracker.findById(userId, function(err, doc) {
    if (err) {
      logger.warn('Error while finding by ID a TimelineEntriesTracker : ', +err.message);
      return callback(err);
    }

    if (doc) {
      changeLastTimelineEntryRead(activityStreamUuid, lastTimelineEntryReadId, doc, function(err, saved) {
        return callback(err, saved);
      });
    }
    else {
      createTimelineEntriesTracker(userId, function(err, saved) {
        if (err) { return callback(err); }
        changeLastTimelineEntryRead(activityStreamUuid, lastTimelineEntryReadId, saved, function(err, saved) {
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
  if (!userId) {
    return callback(new Error('User is required'));
  }
  if (!activityStreamUuid) {
    return callback(new Error('Activity Stream UUID is required'));
  }

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
  var userTuple = {objectType: 'user', id: userId};
  var activityStream = require('./');


  if (!userId) {
    return callback(new Error('User is required'));
  }
  if (!activityStreamUuid) {
    return callback(new Error('Activity Stream UUID is required'));
  }

  function removeDeletedActivities(hash) {
    var nonDeleted = Object.keys(hash).filter(function(k) {
      return hash[k].every(function(activity) {
        return activity.verb !== 'remove';
      });
    });
    var newHash = {};
    nonDeleted.forEach(function(k) {
      newHash[k] = hash[k];
    });
    return newHash;
  }

  function hasRightToReadAtLeastOne(entries) {
    return q.all(
      entries.map(function(entry) {
        var d = q.defer();
        activityStream.getTimelineEntry(entry.id, function(err, entry) {
          if (err || !entry) {
            return d.resolve(0);
          }
          return activityStream.permission.canRead(entry, userTuple, function(err, result) {
            return d.resolve(result ? 1 : 0);
          });
        });
        return d.promise;
      })
    )
    .then(function(results) {
      var sum = results.reduce(function(prev, current) { return prev + current;});
      return q(sum ? true : false);
    });
  }

  function countObjectsUpdate(hash, callback) {
    q.all(
      Object.keys(hash)
      .map(function(key) {
        return hasRightToReadAtLeastOne(hash[key]).then(function(res) {
          return q(res);
        });
      })
    )
    .then(function(responses) {
      var count = responses.filter(Boolean).length;
      return callback(null, count);
    }, function(err) {
      return callback(err);
    });
  }

  getLastTimelineEntryRead(userId, activityStreamUuid, function(err, lastTimelineEntryRead) {
    if (err) { return callback(err); }

    var options = {
      target: {
        objectType: 'activitystream',
        _id: activityStreamUuid
      },
      after: lastTimelineEntryRead,
      stream: true
    };

    activityStream.query(options, function(err, stream) {

      var hash = {};
      stream.on('data', function(doc) {
        if ((doc.actor._id + '') !== (userId + '')) {
          hash[doc.object._id] = hash[doc.object._id] || [];
          hash[doc.object._id].push({verb: doc.verb, id: doc._id});
        }
      });

      stream.on('error', function(err) {
        return callback(err);
      });

      stream.on('close', function() {
        var elligibleEntries = removeDeletedActivities(hash);
        countObjectsUpdate(elligibleEntries, callback);
      });
    });
  });
}

module.exports.getUnreadTimelineEntriesCount = getUnreadTimelineEntriesCount;
