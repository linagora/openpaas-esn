'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var User = mongoose.model('User');
var logger = require('../logger');
var permission = require('./permission');
var async = require('async');
var collaborationModule = require('../collaboration');

var communityObjectType = 'community';

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

var MEMBERSHIP_TYPE_REQUEST = 'request';
var MEMBERSHIP_TYPE_INVITATION = 'invitation';

module.exports.MEMBERSHIP_TYPE_REQUEST = MEMBERSHIP_TYPE_REQUEST;
module.exports.MEMBERSHIP_TYPE_INVITATION = MEMBERSHIP_TYPE_INVITATION;

module.exports.updateAvatar = function(community, avatar, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  if (!avatar) {
    return callback(new Error('Avatar ID is required'));
  }
  community.avatar = avatar;
  community.save(callback);
};

module.exports.save = function(community, callback) {
  if (!community) {
    return callback(new Error('Can not save null community'));
  }

  if (!community.title) {
    return callback(new Error('Can not save community with null title'));
  }

  if (!community.domain_ids || community.domain_ids.length === 0) {
    return callback(new Error('Can not save community without at least a domain'));
  }

  Community.testTitleDomain(community.title, community.domain_ids, function(err, result) {
    if (err) {
      return callback(new Error('Unable to lookup title/domain: ' + community.title + '/' + community.domain_id + ' : ' + err));
    }
    if (result) {
      return callback(new Error('Title/domain: ' + community.title + '/' + community.domain_id + ' already exist.'));
    }

    var com = new Community(community);
    com.save(function(err, response) {
      if (!err) {
        logger.info('Added new community:', { _id: response._id });
      } else {
        logger.info('Error while trying to add a new community:', err.message);
      }
      return callback(err, response);
    });
  });
};

module.exports.load = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }

  var id = community._id || community;
  return Community.findOne({_id: id}, callback);
};

module.exports.loadWithDomains = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  var id = community._id || community;
  return Community.findOne({_id: id}).populate('domain_ids', null, 'Domain').exec(callback);
};

function query(q, callback) {
  return collaborationModule.query(communityObjectType, q, callback);
}
module.exports.query = query;

module.exports.delete = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  return callback(new Error('Not implemented'));
};

module.exports.leave = function(community, userAuthor, userTarget, callback) {
  collaborationModule.leave(communityObjectType, community, userAuthor, userTarget, callback);
};

module.exports.join = function(community, userAuthor, userTarget, actor, callback) {
  collaborationModule.join(communityObjectType, community, userAuthor, userTarget, actor, callback);
};

module.exports.isManager = function(community, user, callback) {
  return collaborationModule.isManager(communityObjectType, community, user, callback);
};

module.exports.isMember = function(community, tuple, callback) {
  return collaborationModule.isMember(community, tuple, callback);
};

module.exports.userToMember = function(document) {
  var result = {};
  if (!document || !document.member) {
    return result;
  }

  if (typeof(document.member.toObject) === 'function') {
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
};

module.exports.getMembers = function(community, query, callback) {
  query = query ||  {};
  var id = community._id || community;
  Community.findById(id, function(err, community) {
    if (err) { return callback(err); }

    var members = community.members.slice().splice(query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT);
    var memberIds = members.map(function(member) { return member.member.id; });
    User.find({_id: {$in: memberIds}}, function(err, users) {
      if (err) { return callback(err); }
      var hash = {};
      users.forEach(function(u) { hash[u._id] = u; });
      members.forEach(function(m) {
        m.member = hash[m.member.id];
      });
      return callback(null, members);
    });
  });
};

module.exports.getManagers = function(community, query, callback) {
  var id = community._id || community;

  var q = Community.findById(id);
  // TODO Right now creator is the only manager. It will change in the futur.
  // query = query ||  {};
  // q.slice('managers', [query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT]);
  q.populate('creator');
  q.exec(function(err, community) {
    if (err) {
      return callback(err);
    }
    return callback(null, community ? [community.creator] : []);
  });
};

function getUserCommunities(user, options, callback) {
  var q = options || {};
  if (typeof(options) === 'function') {
    callback = options;
    q = {};
  }

  if (!user) {
    return callback(new Error('User is required'));
  }

  var id = user._id || user;

  var done = function(err, result) {
    if (err) {
      return callback(err);
    }

    if (!result || result.length === 0) {
      return callback(null, []);
    }

    if (q.writable) {
      async.filter(result, function(community, callback) {
        permission.canWrite(community, {objectType: 'user', id: id + ''}, function(err, writable) {
          if (err) {
            return callback(false);
          }
          if (writable) {
            return callback(true);
          }
          return callback(false);
        });
      }, function(results) {
        return callback(null, results);
      });
    } else {
      return callback(null, result);
    }
  };

  var params = {};

  if (q.member) {
    params.members = {$elemMatch: {'member.objectType': 'user', 'member.id': id}};
  }

  if (q.domainid) {
    params.domain_ids = q.domainid;
  }

  if (q.name) {
    params.title = q.name;
  }

  return query(params, done);
}
module.exports.getUserCommunities = getUserCommunities;
module.exports.getCollaborationsForUser = getUserCommunities;

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

module.exports.getStreamsForUser = function(userId, options, callback) {
  getUserCommunities(userId, options, function(err, projects) {
    if (err) { return callback(err); }
    callback(null, projects.map(communityToStream));
  });
};

module.exports.getMembershipRequests = function(community, query, callback) {
  return collaborationModule.getMembershipRequests(communityObjectType, community._id || community, query, callback);
};

module.exports.addMembershipRequest = function(community, userAuthor, userTarget, workflow, actor, callback) {
  return collaborationModule.addMembershipRequest(communityObjectType, community, userAuthor, userTarget, workflow, actor, callback);
};

module.exports.getMembershipRequest = function(community, user) {
  return collaborationModule.getMembershipRequest(community, user);
};

module.exports.cancelMembershipInvitation = function(community, membership, manager, onResponse) {
  return collaborationModule.cancelMembershipInvitation(communityObjectType, community, membership, manager, onResponse);
};

module.exports.refuseMembershipRequest = function(community, membership, manager, onResponse) {
  return collaborationModule.refuseMembershipRequest(communityObjectType, community, membership, manager, onResponse);
};

module.exports.declineMembershipInvitation = function(community, membership, user, onResponse) {
  return collaborationModule.declineMembershipInvitation(communityObjectType, community, membership, user, onResponse);
};

module.exports.cancelMembershipRequest = function(community, membership, user, onResponse) {
  return collaborationModule.cancelMembershipRequest(communityObjectType, community, membership, user, onResponse);
};

module.exports.cleanMembershipRequest = function(community, user, callback) {
  return collaborationModule.cleanMembershipRequest(community, user, callback);
};

module.exports.search = require('./search');

module.exports.hasDomain = function(community) {
  return collaborationModule.hasDomain(community);
};
