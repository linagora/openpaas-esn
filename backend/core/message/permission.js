'use strict';

var collaborationModule = require('../collaboration');
var permissionHelpers = require('../../helpers/permission');
var userHelpers = require('../../helpers/user');
var async = require('async');

/**
 * User can read a message if he has at least read access to one of the collaboration the message belongs to.
 */
module.exports.canRead = function(message, tuple, callback) {
  if (!message || !tuple) {
    return callback(new Error('Message and tuple are required'));
  }

  if (!Array.isArray(message.shares)) {
    return callback(null, false);
  }

  async.some(message.shares, function(share, canReadShare) {
    if (share.objectType !== 'activitystream') {
      return canReadShare(false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(share.id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return canReadShare(false);
      }

      // Check if the tuple can read in the collaboration
      collaborationModule.permission.canRead(collaborations[0], tuple, function(err, readable) {
        return canReadShare(!err && readable === true);
      });
    });

  }, function(result) {
    return callback(null, result);
  });
};

/**
 * User can read a response message if he is internal OR he has at least his company in the recipients field.
 */
module.exports.canReadResponse = function(response, tuple, callback) {
  if (tuple.objectType !== 'user') {
    return callback(null, true);
  }

  userHelpers.isInternal(tuple.id, function(err, isInternal) {
    if (err) {
      return callback(err);
    }
    // If the user is internal he can read
    if (isInternal) {
      return callback(null, true);
    }

    if (response.visibility && response.visibility === 'private') {
      return callback(null, false);
    }

    permissionHelpers.checkUserCompany(response.recipients, tuple.id, callback);
  });
};

/**
 * User can reply to a message if he has at least write access to one of the communities the message has been shared to.
 */
module.exports.canReply = function(message, user, callback) {
  if (!message || !user) {
    return callback(new Error('Message and user are required'));
  }

  async.some(message.shares, function(share, found) {
    if (share.objectType !== 'activitystream') {
      return found(false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(share.id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return found(false);
      }

      collaborationModule.permission.canWrite(collaborations[0], {objectType: 'user', id: user._id + ''}, function(err, writable) {
        return found(!err && writable === true);
      });
    });

  }, function(result) {
    return callback(null, result);
  });
};
