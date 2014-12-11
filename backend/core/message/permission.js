'use strict';

var collaborationModule = require('../collaboration');
var async = require('async');

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
