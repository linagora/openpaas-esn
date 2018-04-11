'use strict';

var collaborationModule = require('../collaboration');
var async = require('async');

/**
 * User can read a timeline entry if he has at least read access to one of the collaboration the timeline entry has been targeted to and if it has not been deleted.
 */
module.exports.canRead = function(timelineEntry, tuple, callback) {
  if (!timelineEntry || !tuple) {
    return callback(new Error('timelineEntry and tuple are required'));
  }

  if (!Array.isArray(timelineEntry.target)) {
    return callback(null, false);
  }

  if (timelineEntry.verb === 'delete') {
    return callback(null, false);
  }

  async.some(timelineEntry.target, function(target, callback) {
    if (target.objectType !== 'activitystream') {
      return callback(null, false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(target._id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return callback(null, false);
      }

      // Check if the tuple can read in the collaboration
      collaborationModule.permission.canRead(collaborations[0], tuple, callback);
    });
  }, callback);
};
