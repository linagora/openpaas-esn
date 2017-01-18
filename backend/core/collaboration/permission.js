'use strict';

const async = require('async');
const CONSTANTS = require('./constants');

module.exports = function(memberModule) {
  return {
    canFind,
    canRead,
    canWrite,
    filterWritable
  };

  function canFind(collaboration, tuple, callback) {
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

    return memberModule.isIndirectMember(collaboration, tuple, callback);
  }

  function canRead(collaboration, tuple, callback) {
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

    return memberModule.isIndirectMember(collaboration, tuple, callback);
  }

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

    return memberModule.isIndirectMember(collaboration, tuple, callback);
  }

  function filterWritable(collaborations, tuple, callback) {
    if (!collaborations) {
      return callback(new Error('collaborations is required'));
    }

    if (!tuple) {
      return callback(new Error('tuple is required'));
    }

    async.filter(collaborations, (collaboration, callback) => {
      canWrite(collaboration, tuple, callback);
    }, callback);
  }
};
