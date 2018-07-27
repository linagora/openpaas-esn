'use strict';

const async = require('async');
const CONSTANTS = require('./constants');

module.exports = (memberModule, collaborationModule) => {
  return {
    canFind,
    canRead,
    canWrite,
    canLeave,
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

  function canLeave(collaboration, tuple, callback) {
    // check canLeave of registered permission firstly
    const lib = collaborationModule.getLib(collaboration.objectType);

    if (lib && lib.permission && lib.permission.canLeave) {
      return lib.permission.canLeave(tuple.id, collaboration)
        .then(canLeave => callback(null, canLeave))
        .catch(callback);
    }

    // Default rule if not registered: Creator can not leave collaboration
    if (String(tuple.id) === String(collaboration.creator)) {
      return callback(null, false);
    }

    return callback(null, true);
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
