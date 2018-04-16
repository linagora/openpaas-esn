'use strict';

var collaborationModule = require('../collaboration');
var async = require('async');

/**
 * User can read a message if he has at least read access to one of the collaboration the message belongs to.
 */
function canRead(message, tuple, callback) {
  if (!message || !tuple) {
    return callback(new Error('Message and tuple are required'));
  }

  if (!Array.isArray(message.shares)) {
    return callback(null, false);
  }

  async.some(message.shares, function(share, callback) {
    if (share.objectType !== 'activitystream') {
      return callback(null, false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(share.id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return callback(null, false);
      }

      // Check if the tuple can read in the collaboration
      collaborationModule.permission.canRead(collaborations[0], tuple, callback);
    });

  }, callback);
}
module.exports.canRead = canRead;

/**
 * User can always read response message.
 */
module.exports.canReadResponse = function(response, tuple, callback) {
  return callback(null, true);
};

/**
 * User can reply to a message if he has at least write access to one of the communities the message has been shared to.
 */
module.exports.canReply = function(message, user, callback) {
  if (!message || !user) {
    return callback(new Error('Message and user are required'));
  }

  async.some(message.shares, function(share, callback) {
    if (share.objectType !== 'activitystream') {
      return callback(null, false);
    }

    collaborationModule.findCollaborationFromActivityStreamID(share.id, function(err, collaborations) {
      if (err || !collaborations || collaborations.length === 0 || !collaborations[0]) {
        return callback(null, false);
      }

      collaborationModule.permission.canWrite(collaborations[0], {objectType: 'user', id: user.id}, callback);
    });

  }, callback);
};

/**
 * User can like a message if he has at least read access to one of the communities the message has been shared to.
 */
module.exports.canLike = canRead;

/**
 * Oonly message author can delete the message even if shared.
 */
function canDelete(message, tuple, callback) {
  callback(null, tuple.objectType === 'user' && String(message.author) === String(tuple.id));
}
module.exports.canDelete = canDelete;
