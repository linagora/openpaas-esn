'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var logger = require('../logger');
var domainModule = require('../domain');
var async = require('async');
var localpubsub = require('../pubsub').local;
var globalpubsub = require('../pubsub').global;
var permission = require('./permission');

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

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

module.exports.addMembershipRequest = function(community, user, callback) {
  if (!user) {
    return callback(new Error('User object is required'));
  }
  var userId = user._id || user;

  if (!community) {
    return callback(new Error('Community object is required'));
  }

  if (!permission.supportsMemberShipRequests(community)) {
    return callback(new Error('Only Restricted and Private communities allow membership requests.'));
  }

  this.isMember(community, user, function(err, isMember) {
    if (err) {
      return callback(err);
    }
    if (isMember) {
      return callback(new Error('User already member of the community.'));
    }

    var previousRequests = community.membershipRequests.filter(function(request) {
      var requestUserId = request.user._id || request.user;
      return requestUserId.equals(userId);
    });
    if (previousRequests.length > 0) {
      return callback(new Error('User has already requested membership for this community.'));
    }

    community.membershipRequests.push({user: userId});
    community.save(callback);
  });
};
