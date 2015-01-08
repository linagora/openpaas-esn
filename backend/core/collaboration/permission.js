'use strict';

var collaborationModule = require('./index');

var READABLES = ['open', 'restricted'];

module.exports.isPubliclyReadable = function(collaboration) {
  if (!collaboration || !collaboration.type) {
    return false;
  }
  return READABLES.indexOf(collaboration.type) !== -1;
};

module.exports.canWrite = function(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('collaboration object is required'));
  }

  if (collaboration.type === 'open') {
    // Open collaborations allow participation even without a user.
    return callback(null, true);
  } else if (!tuple) {
    // For other collaboration types, require a user
    return callback(new Error('Tuple is required'));
  } else {
    // The remaining case for restricted, private and confidential communities.
    return collaborationModule.isMember(collaboration, tuple, callback);
  }
};

module.exports.supportsMemberShipRequests = function(collaboration) {
  if (!collaboration || !collaboration.type) {
    return false;
  }
  return collaboration.type === 'restricted' || collaboration.type === 'private';
};
