'use strict';

var collaborationModule = require('./index');
var CONSTANTS = require('./constants');
var async = require('async');

module.exports.canRead = function(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('collaboration object is required'));
  }

  if (!tuple) {
    // Tuple is required because the tuple objectType determines the permission
    return callback(new Error('Tuple is required'));
  }

  if (collaboration.type === CONSTANTS.COLLABORATION_TYPES.OPEN || collaboration.type === CONSTANTS.COLLABORATION_TYPES.RESTRICTED) {
    return callback(null, true);
  }
  return collaborationModule.isIndirectMember(collaboration, tuple, callback);
};

function canWrite(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('collaboration object is required'));
  }

  if (!tuple) {
    // Tuple is required because the tuple objectType determines the permission
    return callback(new Error('Tuple is required'));
  }

  if (collaboration.type === CONSTANTS.COLLABORATION_TYPES.OPEN) {
    return callback(null, true);
  }
  return collaborationModule.isIndirectMember(collaboration, tuple, callback);
}
module.exports.canWrite = canWrite;

module.exports.filterWritable = function(collaborations, tuple, callback) {
  if (!collaborations) {
    return callback(new Error('collaborations is required'));
  }

  if (!tuple) {
    return callback(new Error('tuple is required'));
  }

  async.filter(collaborations, function(collaboration, callback) {
    canWrite(collaboration, tuple, callback);
  }, callback);
};

module.exports.supportsMemberShipRequests = function(collaboration) {
  if (!collaboration || !collaboration.type) {
    return false;
  }
  return collaboration.type === CONSTANTS.COLLABORATION_TYPES.RESTRICTED || collaboration.type === CONSTANTS.COLLABORATION_TYPES.PRIVATE;
};

module.exports.canFind = function(collaboration, tuple, callback) {
  if (!collaboration || !collaboration.type) {
    return callback(new Error('Collaboration object is required'));
  }

  if (!tuple) {
    // Tuple is required because the tuple objectType determines the permission
    return callback(new Error('Tuple is required'));
  }
  if (collaboration.type !== CONSTANTS.COLLABORATION_TYPES.CONFIDENTIAL) {
    return callback(null, true);
  }
  return collaborationModule.isIndirectMember(collaboration, tuple, callback);
};
