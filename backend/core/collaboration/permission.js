'use strict';

var collaborationModule = require('./index');

module.exports.canRead = function(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('collaboration object is required'));
  }

  if (!tuple) {
    // Tuple is required because the tuple objectType determines the permission
    return callback(new Error('Tuple is required'));
  }

  if (collaboration.type === 'open' || collaboration.type === 'restricted') {
    return callback(null, true);
  }
  return collaborationModule.isIndirectMember(collaboration, tuple, callback);
};

module.exports.canWrite = function(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('collaboration object is required'));
  }

  if (!tuple) {
    // Tuple is required because the tuple objectType determines the permission
    return callback(new Error('Tuple is required'));
  }

  if (collaboration.type === 'open') {
    return callback(null, true);
  }
  return collaborationModule.isIndirectMember(collaboration, tuple, callback);
};

module.exports.supportsMemberShipRequests = function(collaboration) {
  if (!collaboration || !collaboration.type) {
    return false;
  }
  return collaboration.type === 'restricted' || collaboration.type === 'private';
};

module.exports.canFind = function(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('Collaboration object is required'));
  }

  if (!tuple) {
    // Tuple is required because the tuple objectType determines the permission
    return callback(new Error('Tuple is required'));
  }
  if (collaboration.type !== 'confidential') {
    return callback(null, true);
  }
  return collaborationModule.isIndirectMember(collaboration, tuple, callback);
};
