'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var User = mongoose.model('User');
var logger = require('../logger');
var localpubsub = require('../pubsub').local;
var globalpubsub = require('../pubsub').global;
var permission = require('./permission');
var async = require('async');
var collaboration = require('../collaboration');

var communityObjectType = 'community';

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

var WORKFLOW_NOTIFICATIONS_TOPIC = {
  request: 'community:membership:request',
  invitation: 'community:membership:invite'
};

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
  return collaboration.query(communityObjectType, q, callback);
}
module.exports.query = query;

module.exports.delete = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  return callback(new Error('Not implemented'));
};

module.exports.leave = function(community, userAuthor, userTarget, callback) {
  var id = community._id || community;
  var userAuthor_id = userAuthor._id || userAuthor;
  var userTarget_id = userTarget._id || userTarget;
  var selection = { 'member.objectType': 'user', 'member.id': userTarget_id };
  Community.update(
    {_id: id, members: {$elemMatch: selection} },
    {$pull: {members: selection} },
    function(err, updated) {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('community:leave').forward(globalpubsub, {
        author: userAuthor_id,
        target: userTarget_id,
        community: id
      });

      return callback(null, updated);
    }
  );
};

module.exports.join = function(community, userAuthor, userTarget, actor, callback) {

  var id = community._id;
  var userAuthor_id = userAuthor._id || userAuthor;
  var userTarget_id = userTarget._id || userTarget;

  var member = {
    objectType: 'user',
      id: userTarget_id
  };

  collaboration.addMember(community, userAuthor, member, function(err, updated) {
    if (err) {
      return callback(err);
    }

    localpubsub.topic('community:join').forward(globalpubsub, {
      author: userAuthor_id,
      target: userTarget_id,
      actor: actor || 'user',
      community: id
    });

    return callback(null, updated);
  });
};

module.exports.isManager = function(community, user, callback) {
  var id = community._id || community;
  var user_id = user._id || user;

  Community.findOne({_id: id, 'creator': user_id}, function(err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, !!result);
  });
};

module.exports.isMember = function(community, user, callback) {
  var user_id = user._id || user;
  return collaboration.isMember(community, {objectType: 'user', id: user_id}, callback);
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

module.exports.getUserCommunities = function(user, options, callback) {
  var q = options || {};
  if (typeof(options) === 'function') {
    callback = options;
    q = {};
  }

  var done = function(err, result) {
    if (err) {
      return callback(err);
    }

    if (!result || result.length === 0) {
      return callback(null, []);
    }

    if (q.writable) {
      async.filter(result, function(community, callback) {
        permission.canWrite(community, user, function(err, writable) {
          if (err) {
            return callback(false);
          }
          if (writable) {
            return callback(true);
          }
        });
      }, function(results) {
        return callback(null, results);
      });
    } else {
      return callback(null, result);
    }
  };

  if (!user) {
    return callback(new Error('User is required'));
  }

  var id = user._id || user;
  var params = {
    members: {$elemMatch: { 'member.objectType': 'user', 'member.id': id}}
  };

  if (q.domainid) {
    params.domain_ids = q.domainid;
  }

  if (q.name) {
    params.title = q.name;
  }

  return query(params, done);
};

module.exports.getMembershipRequests = function(community, query, callback) {
  return collaboration.getMembershipRequests(communityObjectType, community._id || community, query, callback);
};

module.exports.addMembershipRequest = function(community, userAuthor, userTarget, workflow, actor, callback) {
  if (!userAuthor) {
    return callback(new Error('Author user object is required'));
  }
  var userAuthorId = userAuthor._id || userAuthor;

  if (!userTarget) {
    return callback(new Error('Target user object is required'));
  }
  var userTargetId = userTarget._id || userTarget;

  if (!community) {
    return callback(new Error('Community object is required'));
  }

  if (!workflow) {
    return callback(new Error('Workflow string is required'));
  }

  var topic = WORKFLOW_NOTIFICATIONS_TOPIC[workflow];
  if (!topic) {
    var errorMessage = 'Invalid workflow, must be ';
    var isFirstLoop = true;
    for (var key in WORKFLOW_NOTIFICATIONS_TOPIC) {
      if (WORKFLOW_NOTIFICATIONS_TOPIC.hasOwnProperty(key)) {
        if (isFirstLoop) {
          errorMessage += '"' + key + '"';
          isFirstLoop = false;
        } else {
          errorMessage += ' or "' + key + '"';
        }
      }
    }
    return callback(new Error(errorMessage));
  }

  if (workflow !== 'invitation' && !permission.supportsMemberShipRequests(community)) {
    return callback(new Error('Only Restricted and Private communities allow membership requests.'));
  }

  this.isMember(community, userTargetId, function(err, isMember) {
    if (err) {
      return callback(err);
    }
    if (isMember) {
      return callback(new Error('User already member of the community.'));
    }

    var previousRequests = community.membershipRequests.filter(function(request) {
      var requestUserId = request.user._id || request.user;
      return requestUserId.equals(userTargetId);
    });
    if (previousRequests.length > 0) {
      return callback(null, community);
    }

    community.membershipRequests.push({user: userTargetId, workflow: workflow});

    community.save(function(err, communitySaved) {
      if (err) {
        return callback(err);
      }

      localpubsub.topic(topic).forward(globalpubsub, {
        author: userAuthorId,
        target: userTargetId,
        community: community._id,
        workflow: workflow,
        actor: actor || 'user'
      });

      return callback(null, communitySaved);
    });
  });
};

module.exports.getMembershipRequest = function(community, user) {
  return collaboration.getMembershipRequest(community, user);
};

module.exports.cancelMembershipInvitation = function(community, membership, manager, onResponse) {
  this.cleanMembershipRequest(community, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('community:membership:invitation:cancel').forward(globalpubsub, {
      author: manager._id,
      target: membership.user,
      membership: membership,
      community: community._id
    });
    onResponse(err, community);
  });
};

module.exports.refuseMembershipRequest = function(community, membership, manager, onResponse) {
  this.cleanMembershipRequest(community, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('community:membership:request:refuse').forward(globalpubsub, {
      author: manager._id,
      target: membership.user,
      membership: membership,
      community: community._id
    });
    onResponse(err, community);
  });
};

module.exports.declineMembershipInvitation = function(community, membership, user, onResponse) {
  this.cleanMembershipRequest(community, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('community:membership:invitation:decline').forward(globalpubsub, {
      author: user._id,
      target: community._id,
      membership: membership,
      community: community._id
    });
    onResponse(err, community);
  });
};

module.exports.cancelMembershipRequest = function(community, membership, user, onResponse) {
  this.cleanMembershipRequest(community, membership.user, function(err) {
    if (err) { return onResponse(err); }
    localpubsub.topic('community:membership:request:cancel').forward(globalpubsub, {
      author: user._id,
      target: community._id,
      membership: membership,
      community: community._id
    });
    onResponse(err, community);
  });
};

module.exports.cleanMembershipRequest = function(community, user, callback) {
  if (!user) {
    return callback(new Error('User author object is required'));
  }

  if (!community) {
    return callback(new Error('Community object is required'));
  }

  var userId = user._id || user;


  var otherUserRequests = community.membershipRequests.filter(function(request) {
    var requestUserId = request.user._id || request.user;
    return !requestUserId.equals(userId);
  });

  community.membershipRequests = otherUserRequests;
  community.save(callback);
};

module.exports.search = require('./search');
