'use strict';

var communityModule = require('./index');

module.exports.canWrite = function(community, user, callback) {

  if (!community || !community.type) {
    return callback(new Error('Community object is required'));
  }

  if (community.type === 'open') {
    return callback(null, true);
  }

  if (!user) {
    return callback(new Error('User is required'));
  }

  if (community.type === 'restricted') {
    return communityModule.isMember(community, user, callback);
  }

  return callback(new Error('Can not define write rights for this community'));
};
