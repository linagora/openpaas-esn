'use strict';

var communityPermission = require('../community/permission');
var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var async = require('async');

var getCommunityFromStreamId = function(streamId, callback) {
  return Community.getFromActivityStreamID(streamId, callback);
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

    getCommunityFromStreamId(share.id, function(err, community) {

      if (err || !community) {
        return found(false);
      }

      communityPermission.canWrite(community, user, function(err, writable) {
        return found(!err && writable === true);
      });
    });

  }, function(result) {
    return callback(null, result);
  });
};
