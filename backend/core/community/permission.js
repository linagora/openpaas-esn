const {
  isManager,
  isIndirectMember
} = require('./member');

module.exports = collaborationModule => {
  return {
    canFind,
    canRead,
    canRemoveContent,
    canWrite,
    filterWritable
  };

  function canFind(community, tuple, callback) {
    return collaborationModule.permission.canFind(community, tuple, callback);
  }

  function canRead(community, tuple, callback) {
    isIndirectMember(community, tuple, (err, _isIndirectMember) => {
      if (err) return callback(err);

      if (_isIndirectMember) return callback(null, true);

      return isManager(community, { _id: tuple.id }, callback);
    });
  }

  function canWrite(community, tuple, callback) {
    return collaborationModule.permission.canWrite(community, tuple, callback);
  }

  function canRemoveContent(community, tuple, callback) {
    return isManager(community, { _id: tuple.id }, callback);
  }

  function filterWritable(communities, tuple, callback) {
    return collaborationModule.permission.filterWritable(communities, tuple, callback);
  }
};
