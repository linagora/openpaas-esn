require('./model');

const SimulatedCollaboration = require('mongoose').model('SimulatedCollaboration');
const collaborationModule = require('../../../../backend/core/collaboration');
const tupleModule = require('../../../../backend/core/tuple');
const { OBJECT_TYPE } = require('../constants');

module.exports = {
  addMember,
  create,
  get,
  registerCollaborationModule
};

function registerCollaborationModule() {
  collaborationModule.registerCollaborationLib(OBJECT_TYPE, {
    getStreamsForUser,
    getCollaborationsForUser: getCollaborationForUser
  });
  collaborationModule.registerCollaborationModel(OBJECT_TYPE, 'SimulatedCollaboration');
}

function addMember(options, callback) {
  const { collaboration, userAuthor, userTarget, actor } = options;

  return collaborationModule.member.join(OBJECT_TYPE, collaboration, userAuthor, userTarget, actor, callback);
}

function create(collaboration, callback) {
  collaboration = collaboration instanceof SimulatedCollaboration ? collaboration : new SimulatedCollaboration(collaboration);

  return collaboration.save(callback);
}

function get(collaborationId, callback) {
  SimulatedCollaboration.findOne({ _id: collaborationId }, callback);
}

function getStreamsForUser(userId, options, callback) {
  return getCollaborationForUser(userId, options, (err, collaborations) => {
    if (err) {
      return callback(err);
    }

    return callback(null, collaborations.map(collaborationToStream));
  });
}

function getCollaborationForUser(user, options, callback) {
  let query = options || {};
  const params = {};

  if (typeof options === 'function') {
    callback = options;
    query = {};
  }

  if (!user) {
    return callback(new Error('User is required'));
  }

  const userId = user._id || user;

  if (query.member) {
    params.members = {$elemMatch: {'member.objectType': 'user', 'member.id': userId}};
  }

  if (query.domainid) {
    params.domain_ids = query.domainid;
  }

  if (query.name) {
    params.title = query.name;
  }

  collaborationModule.query(OBJECT_TYPE, params, (err, result) => {
    if (err) {
      return callback(err);
    }

    if (!result || result.length === 0) {
      return callback(null, []);
    }

    if (query.writable) {
      return collaborationModule.permission.filterWritable(result, tupleModule.user(userId), callback);
    }

    return callback(null, result);
  });
}

function collaborationToStream(collaboration) {
  return {
    uuid: collaboration.activity_stream.uuid,
    target: {
      objectType: OBJECT_TYPE,
      _id: collaboration._id,
      id: `urn:linagora.com:${OBJECT_TYPE}:${collaboration._id}`
    }
  };
}
