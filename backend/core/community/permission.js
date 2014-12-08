'use strict';

var communityModule = require('./index');

module.exports.canWrite = function(community, user, callback) {
  if (!community || !community.type) {
    return callback(new Error('Community object is required'));
  }

  if (community.type === 'open') {
    // Open communities allow participation even without a user.
    return callback(null, true);
  } else if (!user) {
    // For other community types, require a user
    return callback(new Error('User is required'));
  } else {
    // The remaining case for restricted, private and confidential communities.
    return communityModule.isMember(community, {objectType: 'user', id: user._id}, callback);
  }
};

module.exports.supportsMemberShipRequests = function(community) {
  if (!community || !community.type) {
    return false;
  }
  return community.type === 'restricted' || community.type === 'private';
};
