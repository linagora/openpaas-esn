'use strict';

var async = require('async');
var community = require('../core/community');

/**
 * Get an array of user ids with the community context if exist by expanding the targets array.
 * targets : [
 *    {
 *      objectType: {string},
 *      id: {ObjectId}
 *    }
 * ]
 *
 * @param {Object[]} targets the targets
 * @param {function} callback fn like callback(err, {_id: userId, context: communityId})
 */
module.exports.getUserIds = function(targets, callback) {
  if (!targets) {
    return callback(new Error('Targets can not be null'));
  }
  if (!require('util').isArray(targets)) {
    return callback(new Error('Targets must be an array'));
  }

  var usersFound = Object.create(null);

  function addUsersIfNotFoundOrContextUndefined(userId, communityId) {
    if (!usersFound[userId]) {
      usersFound[userId] = communityId;
    }
  }

  async.each(targets, function(target, callback) {
    if (target.objectType === 'user') {
      addUsersIfNotFoundOrContextUndefined(target.id);
      callback();
    } else if (target.objectType === 'community') {
      community.getMembers(target.id, null, function(err, members) {
        if (err) {
          return callback(err);
        }
        members.forEach(function(member) {
          addUsersIfNotFoundOrContextUndefined(member.user.toString(), target.id);
        });
        callback();
      });
    }
  }, function(err) {
    if (err) {
      return callback(err);
    }
    var usersResult = [];
    for (var userId in usersFound) {
      usersResult.push({_id: userId, context: usersFound[userId]});
    }
    return callback(null, usersResult);
  });
};
