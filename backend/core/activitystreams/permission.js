'use strict';

var collaborationModule = require('../collaboration');
var permissionHelpers = require('../../helpers/permission');
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

  async.some(timelineEntry.target, function(target, canReadTimelineEntryTarget) {
    if (target.objectType !== 'activitystream') {
      return canReadTimelineEntryTarget(false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(target._id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return canReadTimelineEntryTarget(false);
      }

      // Check if the tuple can read in the collaboration
      collaborationModule.permission.canRead(collaborations[0], tuple, function(err, readable) {
        // If there is an error OR if the tuple can not read in the collaboration then the tuple can not read the timeline entry target
        if (err || !readable) {
          return canReadTimelineEntryTarget(false);
        }

        // If the timeline entry object is NOT an organizational message then return the collaboration permission
        if (!timelineEntry.object || timelineEntry.object.objectType !== 'organizational') {
          return canReadTimelineEntryTarget(true);
        }

        // If the tuple is NOT a user then return the collaboration permission
        if (tuple.objectType !== 'user') {
          return canReadTimelineEntryTarget(true);
        }

        permissionHelpers.checkUserCompany(timelineEntry.to, tuple.id, function(err, canRead) {
          if (err) {
            return canReadTimelineEntryTarget(false);
          }
          return canReadTimelineEntryTarget(canRead);
        });
      });
    });
  }, function(canRead) {
    return callback(null, canRead);
  });
};
