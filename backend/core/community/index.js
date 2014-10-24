'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var userNotification = require('../../core/notification/user');
var logger = require('../logger');
var domainModule = require('../domain');
var async = require('async');
var localpubsub = require('../pubsub').local;
var globalpubsub = require('../pubsub').global;
var permission = require('./permission');

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

var WORKFLOW_NOTIFICATIONS_TOPIC = {
  request: 'community:membership:request',
  invitation: 'community:membership:invite'
};

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
  q = q || {};
  return Community.find(q, callback);
}
module.exports.query = query;

module.exports.delete = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  return callback(new Error('Not implemented'));
};

module.exports.userIsCommunityMember = function(user, community, callback) {
  if (!user || !user._id) {
    return callback(new Error('User object is required'));
  }

  if (!community || !community._id) {
    return callback(new Error('Community object is required'));
  }

  if (!community.domain_ids || community.domain_ids.length === 0) {
    return callback(new Error('Community does not belong to any domain'));
  }

  var userInDomain = function(domain_id, callback) {
    domainModule.load(domain_id, function(err, domain) {
      if (err) {
        return callback(false);
      }
      domainModule.userIsDomainMember(user, domain, function(err, isMember) {
        if (err) {
          return callback(false);
        }
        return callback(isMember);
      });
    });
  };

  async.some(community.domain_ids, userInDomain, function(result) {
    return callback(null, result);
  });
};

module.exports.leave = function(community, userAuthor, userTarget, callback) {
  var id = community._id || community;
  var userAuthor_id = userAuthor._id || userAuthor;
  var userTarget_id = userTarget._id || userTarget;

  Community.update({_id: id, 'members.user': userTarget_id}, {$pull: {members: {user: userTarget_id}}}, function(err, updated) {
    if (err) {
      return callback(err);
    }

    localpubsub.topic('community:leave').forward(globalpubsub, {
      author: userAuthor_id,
      target: userTarget_id,
      community: id
    });

    return callback(null, updated);
  });
};

module.exports.join = function(community, userAuthor, userTarget, callback) {
  var id = community._id || community;
  var userAuthor_id = userAuthor._id || userAuthor;
  var userTarget_id = userTarget._id || userTarget;

  Community.update({_id: id, 'members.user': {$ne: userTarget_id}}, {$push: {members: {user: userTarget_id, status: 'joined'}}}, function(err, updated) {
    if (err) {
      return callback(err);
    }

    localpubsub.topic('community:join').forward(globalpubsub, {
      author: userAuthor_id,
      target: userTarget_id,
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
  var id = community._id || community;
  var user_id = user._id || user;

  Community.findOne({_id: id, 'members.user': user_id}, function(err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, !!result);
  });
};

module.exports.userToMember = function(document) {
  var result = {};
  if (!document || !document.user) {
    return result;
  }

  if (typeof(document.user.toObject) === 'function') {
    result.user = document.user.toObject();
  } else {
    result.user = document.user;
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

  var q = Community.findById(id);
  q.slice('members', [query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT]);
  q.populate('members.user');
  q.exec(function(err, community) {
    if (err) {
      return callback(err);
    }
    return callback(null, community ? community.members : []);
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

module.exports.getUserCommunities = function(user, domainId, callback) {
  if (typeof(domainId) === 'function') {
    callback = domainId;
    domainId = null;
  }

  if (!user) {
    return callback(new Error('User is required'));
  }
  var id = user._id ||  user;
  if (domainId) {
    return query({'members.user': id, 'domain_ids': domainId}, callback);
  }
  return query({'members.user': id}, callback);
};

module.exports.getMembershipRequests = function(community, query, callback) {
  query = query || {};
  var id = community._id || community;

  var q = Community.findById(id);
  q.slice('membershipRequests', [query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT]);
  q.populate('membershipRequests.user');
  q.exec(function(err, community) {
    if (err) {
      return callback(err);
    }
    return callback(null, community ? community.membershipRequests : []);
  });
};

module.exports.addMembershipRequest = function(community, userAuthor, userTarget, workflow, callback) {
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

  if (!permission.supportsMemberShipRequests(community)) {
    return callback(new Error('Only Restricted and Private communities allow membership requests.'));
  }

  var self = this;
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

      self.addMembershipInviteUserNotification(community, userAuthorId, userTargetId, function(err, userNotificationSaved) {
        if (err) {
          return callback(err);
        }

        localpubsub.topic(topic).forward(globalpubsub, {
          author: userAuthorId,
          target: userTargetId,
          community: community._id
        });
        return callback(null, communitySaved);
      });
    });
  });
};

module.exports.getMembershipRequest = function(community, user) {
  if (!community.membershipRequests) {
    return false;
  }
  var mr = community.membershipRequests.filter(function(mr) {
    return mr.user.equals(user._id);
  });
  return mr.pop();
};

module.exports.removeMembershipRequest = function(community, userAuthor, userTarget, actor, callback) {
  if (!userAuthor) {
    return callback(new Error('User author object is required'));
  }

  if (!userTarget) {
    return callback(new Error('User target object is required'));
  }

  var userAuthorId = userAuthor._id || userAuthor;
  var userTargetId = userTarget._id || userTarget;

  if (!community) {
    return callback(new Error('Community object is required'));
  }

  if (!permission.supportsMemberShipRequests(community)) {
    return callback(new Error('Only Restricted and Private communities allow membership requests.'));
  }

  this.isMember(community, userTargetId, function(err, isMember) {
    if (err) {
      return callback(err);
    }
    if (isMember) {
      return callback(new Error('User already member of the community.'));
    }

    var otherUserRequests = community.membershipRequests.filter(function(request) {
      var requestUserId = request.user._id || request.user;
      return !requestUserId.equals(userTargetId);
    });

    community.membershipRequests = otherUserRequests;
    community.save(function(err, updated) {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('community:membership:remove').forward(globalpubsub, {
        author: userAuthorId,
        target: userTargetId,
        actor: actor || 'user',
        community: community._id || community
      });

      return callback(null, updated);
    });
  });
};

module.exports.addMembershipInviteUserNotification = function(community, userAuthor, userTarget, callback) {
  var userAuthorId = userAuthor._id || userAuthor;
  var userTargetId = userTarget._id || userTarget;
  var communityId = community._id || community;

  var userNotificationObject = {
    subject: {
      objectType: 'user',
      id: userAuthorId
    },
    verb: {
      label: 'invites you to join',
      text: 'invites you to join'
    },
    complement: {
      objectType: 'community',
      id: communityId
    },
    category: 'community:membership:invite',
    interactive: true,
    target: [{
      objectType: 'user',
      id: userTargetId
    }]
  };

  userNotification.create(userNotificationObject, callback);
};
