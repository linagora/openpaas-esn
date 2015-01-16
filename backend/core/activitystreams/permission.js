'use strict';

var collaborationModule = require('../collaboration');
var async = require('async');

/**
 * User can read a timeline entry if he has at least read access to one of the collaboration the timeline entry has been targeted to.
 */
module.exports.canRead = function(timelineEntry, tuple, callback) {
  if (!timelineEntry || !tuple) {
    return callback(new Error('timelineEntry and tuple are required'));
  }

  if (!Array.isArray(timelineEntry.target)) {
    return callback(null, false);
  }

  async.some(timelineEntry.target, function(target, found) {
    if (target.objectType !== 'activitystream') {
      return found(false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(target._id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return found(false);
      }

      collaborationModule.permission.canRead(collaborations[0], tuple, function(err, readable) {
        return found(!err && readable === true);
      });
    });

  }, function(result) {
    return callback(null, result);
  });
};
