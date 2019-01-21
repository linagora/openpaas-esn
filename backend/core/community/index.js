'use strict';

const mongoose = require('mongoose');
const Community = mongoose.model('Community');
const logger = require('../logger');
const collaborationModule = require('../collaboration');
const permission = require('./permission')(collaborationModule);
const member = require('./member');
const tuple = require('../tuple');
const localpubsub = require('../pubsub').local;
const globalpubsub = require('../pubsub').global;
const CONSTANTS = require('./constants');
const search = require('./search');
const archive = require('./archive');
const communityObjectType = CONSTANTS.OBJECT_TYPE;

module.exports = {
  delete: remove,
  getCollaborationsForUser: getUserCommunities,
  getUserCommunities,
  getStreamsForUser,
  hasDomain,
  load,
  loadWithDomains,
  permission,
  query,
  save,
  search,
  update,
  updateAvatar,
  userToMember,
  member
};
collaborationModule.registerCollaborationModel(communityObjectType, CONSTANTS.MODEL_NAME);
collaborationModule.registerCollaborationLib(communityObjectType, module.exports);
collaborationModule.memberResolver.registerResolver(communityObjectType, CONSTANTS.MODEL_NAME);

function communityToStream(community) {
  return {
    uuid: community.activity_stream.uuid,
    target: {
      objectType: 'community',
      _id: community._id,
      displayName: community.title,
      id: 'urn:linagora.com:community:' + community._id,
      image: community.avatar || ''
    }
  };
}

function getStreamsForUser(userId, options, callback) {
  getUserCommunities(userId, options, (err, communities) => {
    if (err) {
      return callback(err);
    }

    callback(null, communities.map(communityToStream));
  });
}

function getUserCommunities(user, options, callback) {
  let q = options || {};
  const params = {};

  if (typeof options === 'function') {
    callback = options;
    q = {};
  }

  if (!user) {
    return callback(new Error('User is required'));
  }

  const id = user._id || user;
  const done = function(err, result) {
    if (err) {
      return callback(err);
    }

    if (!result || result.length === 0) {
      return callback(null, []);
    }

    if (q.writable) {
      return permission.filterWritable(result, tuple.user(id), callback);
    }

    callback(null, result);
  };

  if (q.member) {
    params.members = {$elemMatch: {'member.objectType': 'user', 'member.id': id}};
  }

  if (q.domainid) {
    params.domain_ids = q.domainid;
  }

  if (q.name) {
    params.title = q.name;
  }

  query(params, done);
}

function hasDomain(community, domainId) {
  collaborationModule.hasDomain(community, domainId);
}

function load(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }

  var id = community._id || community;

  Community.findOne({_id: id}, callback);
}

function loadWithDomains(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  const id = community._id || community;

  Community.findOne({_id: id}).populate('domain_ids', null, 'Domain').exec(callback);
}

function query(q, callback) {
  collaborationModule.query(communityObjectType, q, callback);
}

function remove(community, user) {
  if (!community) {
    return Promise.reject(new Error('Community is required'));
  }

  if (!user) {
    return Promise.reject(new Error('User is required'));
  }

  return archive.process(community, user);
}

function save(community, callback) {
  if (!community) {
    return callback(new Error('Can not save null community'));
  }

  if (!community.title) {
    return callback(new Error('Can not save community with null title'));
  }

  if (!community.domain_ids || community.domain_ids.length === 0) {
    return callback(new Error('Can not save community without at least a domain'));
  }

  const com = new Community(community);

  com.save((err, response) => {
    if (!err) {
      logger.info('Added new community:', { _id: response._id });
      localpubsub.topic(CONSTANTS.EVENTS.communityCreated).publish(response);
    } else {
      logger.error('Error while trying to add a new community:', err.message);
    }

    callback(err, response);
  });
}

function update(community, modifications, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }

  if (modifications.title) {
    community.title = modifications.title;
  }

  if (modifications.avatar) {
    community.avatar = modifications.avatar;
  }

  if (modifications.description) {
    community.description = modifications.description;
  }

  if (modifications.newMembers) {
    modifications.newMembers.forEach(member => {
      community.members.push({
        member: {
          id: member._id || member,
          objectType: 'user'
        }
      });
    });
  }

  if (modifications.deleteMembers) {
    modifications.deleteMembers.forEach(member => {
      const idMember = member._id || member;

      community.members = community.members.filter(memberCommunity => memberCommunity.member.id.toString() !== idMember.toString());
    });
  }

  community.save(function(err, community) {
    if (!err) {
      localpubsub.topic(CONSTANTS.EVENTS.communityUpdate).forward(globalpubsub, {
        modifications: modifications,
        community: community
      });
    }

    callback.apply(null, arguments);
  });
}

function updateAvatar(community, avatar, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  if (!avatar) {
    return callback(new Error('Avatar ID is required'));
  }
  community.avatar = avatar;
  community.save(callback);
}

function userToMember(document) {
  var result = {};

  if (!document || !document.member) {
    return result;
  }

  if (typeof document.member.toObject === 'function') {
    result.user = document.member.toObject();
  } else {
    result.user = document.member;
  }

  delete result.user.password;
  delete result.user.avatars;
  delete result.user.login;

  result.metadata = {
    timestamps: document.timestamps
  };

  return result;
}
