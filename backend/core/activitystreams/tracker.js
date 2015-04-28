'use strict';

var activityStream = require('./');
var logger = require('../logger');
var mongoose = require('mongoose');
var q = require('q');

var models = {
  push: 'PushTimeLineEntriesTracker',
  read: 'ReadTimeLineEntriesTracker'
};

function getModel(type) {
  var modelName = models[type];
  if (!modelName) {
    return;
  }
  return mongoose.model(modelName);
}

module.exports.getTracker = function(type) {

  var Tracker = getModel(type);
  if (!Tracker) {
    throw new Error(type + ' is not a valid tracker type');
  }

  function exists(userId, callback) {
    userId = userId._id || userId;
    Tracker.findById(userId, function(err, doc) {
      if (err) {
        return callback(err);
      }
      return callback(null, !!doc);
    });
  }

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

    var timelineEntriesTrackerAsModel = new Tracker(timelineEntriesTracker);
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
   * Change the last TimelineEntry pointer for the specified document
   *
   * @param {string} activityStreamUuid
   * @param {ObjectId} lastTimelineEntryUsedId
   * @param {TimelineEntriesTracker} doc
   * @param {function} callback fn like callback(err, saved) (saved is the document saved)
   */
  function changeLastTimelineEntry(activityStreamUuid, lastTimelineEntryUsedId, doc, callback) {
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
   * Update the last TimelineEntry pointer by a user in the specified ActivityStream
   *
   * @param {User, ObjectId} userId
   * @param {string} activityStreamUuid
   * @param {TimelineEntry, ObjectId} lastTimelineEntryReadId
   * @param {function} callback fn like callback(err, saved) (saved is the document saved)
   */
  function updateLastTimelineEntry(userId, activityStreamUuid, lastTimelineEntryReadId, callback) {
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

    Tracker.findById(userId, function(err, doc) {
      if (err) {
        logger.warn('Error while finding by ID a TimelineEntriesTracker : ', +err.message);
        return callback(err);
      }

      if (doc) {
        return changeLastTimelineEntry(activityStreamUuid, lastTimelineEntryReadId, doc, callback);
      }

      createTimelineEntriesTracker(userId, function(err, saved) {
        if (err) {
          return callback(err);
        }
        changeLastTimelineEntry(activityStreamUuid, lastTimelineEntryReadId, saved, callback);
      });

    });
  }

  /**
   * Get the last TimelineEntry id for a user in the specified ActivityStream
   *
   * @param {User, ObjectId} userId
   * @param {string} activityStreamUuid
   * @param {function} callback fn like callback(err, objectId)
   */
  function getLastTimelineEntry(userId, activityStreamUuid, callback) {
    if (!userId) {
      return callback(new Error('User is required'));
    }
    if (!activityStreamUuid) {
      return callback(new Error('Activity Stream UUID is required'));
    }

    userId = userId._id || userId;

    Tracker.findById(userId, function(err, doc) {
      if (err) {
        logger.warn('Error while finding by ID a TimelineEntriesTracker : ', +err.message);
        return callback(err);
      }

      return callback(null, doc && doc.timelines[activityStreamUuid]);
    });
  }

  /**
   * Count the number of TimelineEntries since last id
   *
   * @param {User, ObjectId} userId
   * @param {string} activityStreamUuid
   * @param {function} callback fn like callback(err, count) (count is a number)
   */
  function countSinceLastTimelineEntry(userId, activityStreamUuid, callback) {
    var userTuple = {objectType: 'user', id: userId};

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
          var sum = results.reduce(function(prev, current) {
            return prev + current;
          });
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

    getLastTimelineEntry(userId, activityStreamUuid, function(err, lastTimelineEntryRead) {
      if (err) {
        return callback(err);
      }

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

        stream.on('error', callback);

        stream.on('close', function() {
          var elligibleEntries = removeDeletedActivities(hash);
          countObjectsUpdate(elligibleEntries, callback);
        });
      });
    });
  }

  /**
   * Build a view of a message thread from the last tracked timeline entry.
   * The thread contains all the references to messages which have not been already processed by/for the user.
   */
  function buildThreadViewSinceLastTimelineEntry(userId, activityStreamUuid, callback) {

    if (!userId) {
      return callback(new Error('User is required'));
    }
    if (!activityStreamUuid) {
      return callback(new Error('Activity Stream UUID is required'));
    }

    getLastTimelineEntry(userId, activityStreamUuid, function(err, lastTimelineEntryRead) {
      if (err) {
        return callback(err);
      }

      var options = {
        target: {
          objectType: 'activitystream',
          _id: activityStreamUuid
        },
        stream: true
      };

      if (lastTimelineEntryRead) {
        options.after = lastTimelineEntryRead;
      }

      activityStream.query(options, function(err, stream) {
        var hash = {};

        stream.on('data', function(doc) {
          var isReply = doc.inReplyTo && doc.inReplyTo.length > 0;
          var tuple = isReply ? doc.inReplyTo[0] : doc.object;
          hash[tuple._id] = hash[tuple._id] || {message: tuple, timelineentry: {_id: doc._id, published: doc.published} , responses: []};

          if (isReply) {
            hash[tuple._id].responses.push({message: doc.object, timelineentry: {_id: doc._id, published: doc.published}});
          }
        });

        stream.on('error', callback);

        stream.on('close', function() {
          return callback(null, hash);
        });
      });
    });
  }

  return {
    exists: exists,
    updateLastTimelineEntry: updateLastTimelineEntry,
    getLastTimelineEntry: getLastTimelineEntry,
    countSinceLastTimelineEntry: countSinceLastTimelineEntry,
    buildThreadViewSinceLastTimelineEntry: buildThreadViewSinceLastTimelineEntry
  };
};

