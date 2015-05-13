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

  /**
   * Update the last TimelineEntry pointer by a user in the specified ActivityStream
   *
   * @param {User, ObjectId} userId
   * @param {string} activityStreamUuid
   * @param {TimelineEntry, ObjectId} lastTimelineEntryReadId
   * @param {function} callback fn like callback(err)
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

    var updateQuery = {$set: {}};
    updateQuery.$set['timelines.' + activityStreamUuid] = lastTimelineEntryReadId;
    Tracker.update({_id: userId}, updateQuery, {upsert: true}, function(err) {
      if (err) {
        logger.error('Error while updating by ID a TimelineEntriesTracker : ', + err.message);
        return callback(err);
      }
      return callback();
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
          // Skip the timeline entry if the actor id is the actual user id
          if (doc.actor && doc.actor._id.toString() === userId.toString()) {
            return;
          }
          var isReply = doc.inReplyTo && doc.inReplyTo.length > 0;
          var tuple = isReply ? doc.inReplyTo[0] : doc.object;
          hash[tuple._id] = hash[tuple._id] || {message: tuple, timelineentry: {_id: doc._id, published: doc.published} , responses: [], read: true};

          if (isReply) {
            hash[tuple._id].responses.push({message: doc.object, timelineentry: {_id: doc._id, published: doc.published}, read: false});
          } else {
            hash[tuple._id].read = false;
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
    updateLastTimelineEntry: updateLastTimelineEntry,
    getLastTimelineEntry: getLastTimelineEntry,
    countSinceLastTimelineEntry: countSinceLastTimelineEntry,
    buildThreadViewSinceLastTimelineEntry: buildThreadViewSinceLastTimelineEntry
  };
};

