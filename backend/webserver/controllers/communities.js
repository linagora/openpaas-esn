'use strict';

var communityModule = require('../../core/community');
var userDomain = require('../../core/user/domain');
var imageModule = require('../../core/image');
var uuid = require('node-uuid');
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
var escapeStringRegexp = require('escape-string-regexp');
var permission = require('../../core/community/permission');
var logger = require('../../core/logger');
var async = require('async');

function transform(community, user, callback) {
  if (!community) {
    return {};
  }

  var membershipRequest = communityModule.getMembershipRequest(community, user);

  if (typeof(community.toObject) === 'function') {
    community = community.toObject();
  }

  community.members_count = community.members ? community.members.length : 0;
  delete community.members;

  delete community.membershipRequests;
  if (membershipRequest) {
    community.membershipRequest = membershipRequest.timestamp.creation.getTime();
  }

  communityModule.isMember(community._id, user._id, function(err, membership) {
    if (membership) {
      community.member_status = 'member';
    } else {
      community.member_status = 'none';
    }
    return callback(community);
  });
}

function ensureLoginCommunityAndUserId(req, res) {
  var community = req.community;
  var user = req.user;

  if (!user) {
    res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
    return false;
  }

  if (!req.params || !req.params.user_id) {
    res.json(400, {error: {code: 400, message: 'Bad Request', details: 'The user_id parameter is missing'}});
    return false;
  }

  if (!community) {
    res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
    return false;
  }
  return true;
}

module.exports.loadDomainForCreate = function(req, res, next) {
  var domains = req.body.domain_ids;
  if (!domains) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Domain ids is mandatory'}});
  }
  if (domains.length === 0) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Domain id is mandatory'}});
  }
  req.params.uuid = domains[0];
  var domainController = require('./domains');
  return domainController.load(req, res, next);
};

module.exports.create = function(req, res) {

  var community = {
    title: req.body.title,
    creator: req.user._id,
    type: 'open',
    members: [{user: req.user._id}]
  };

  if (!community.title) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Community title is mandatory'}});
  }

  if (!req.body.domain_ids) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Community domain is mandatory'}});
  }

  if (req.body.domain_ids.length === 0) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'At least a domain is required'}});
  }

  community.domain_ids = req.body.domain_ids;

  if (req.body.type) {
    community.type = req.body.type;
  }

  if (req.body.description) {
    community.description = req.body.description;
  }

  communityModule.save(community, function(err, saved) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community save error', details: err}});
    }
    transform(saved, req.user, function(result) {
      return res.json(201, result);
    });
  });
};

module.exports.list = function(req, res) {
  var query = {};
  if (req.domain) {
    query.domain_ids = [req.domain._id];
  }

  if (req.param('creator')) {
    query.creator = req.param('creator');
  }

  if (req.param('title')) {
    var escapedString = escapeStringRegexp(req.param('title'));
    query.title = new RegExp('^' + escapedString + '$', 'i');
  }

  communityModule.query(query, function(err, response) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community list failed', details: err}});
    }

    async.map(response, function(community, callback) {
      transform(community, req.user, function(transformed) {
        return callback(null, transformed);
      });
    }, function(err, results) {
      return res.json(200, results);
    });
  });
};

module.exports.load = function(req, res, next) {
  communityModule.load(req.params.id, function(err, community) {
    if (err) {
      return next(err);
    }
    if (!community) {
      return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
    }
    req.community = community;
    return next();
  });
};

module.exports.get = function(req, res) {
  if (req.community) {
    transform(req.community, req.user, function(transformed) {
      permission.canWrite(req.community, req.user, function(err, writable) {
        var result = transformed;
        result.writable = writable;
        return res.json(200, result);
      });
    });
  } else {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }
};

module.exports.delete = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  communityModule.delete(req.community, function(err) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community delete failed', details: err}});
    }
    return res.json(204);
  });
};

module.exports.uploadAvatar = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  if (!req.query.mimetype) {
    return res.json(400, {error: 400, message: 'Parameter missing', details: 'mimetype parameter is required'});
  }

  var mimetype = req.query.mimetype.toLowerCase();
  if (acceptedImageTypes.indexOf(mimetype) < 0) {
    return res.json(400, {error: 400, message: 'Bad parameter', details: 'mimetype ' + req.query.mimetype + ' is not acceptable'});
  }

  if (!req.query.size) {
    return res.json(400, {error: 400, message: 'Parameter missing', details: 'size parameter is required'});
  }

  var size = parseInt(req.query.size);
  if (isNaN(size)) {
    return res.json(400, {error: 400, message: 'Bad parameter', details: 'size parameter should be an integer'});
  }
  var avatarId = uuid.v1();

  function updateCommunityAvatar() {
    communityModule.updateAvatar(req.community, avatarId, function(err, update) {
      if (err) {
        return res.json(500, {error: 500, message: 'Datastore failure', details: err.message});
      }
      return res.json(200, {_id: avatarId});
    });
  }

  function avatarRecordResponse(err, storedBytes) {
    if (err) {
      if (err.code === 1) {
        return res.json(500, {error: 500, message: 'Datastore failure', details: err.message});
      } else if (err.code === 2) {
        return res.json(500, {error: 500, message: 'Image processing failure', details: err.message});
      } else {
        return res.json(500, {error: 500, message: 'Internal server error', details: err.message});
      }
    } else if (storedBytes !== size) {
      return res.json(412, {error: 412, message: 'Image size does not match', details: 'Image size given by user agent is ' + size +
        ' and image size returned by storage system is ' + storedBytes});
    }
    updateCommunityAvatar();
  }

  var metadata = {};
  if (req.user) {
    metadata.creator = {objectType: 'user', id: req.user._id};
  }

  return imageModule.recordAvatar(avatarId, mimetype, metadata, req, avatarRecordResponse);
};

module.exports.getAvatar = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  if (!req.community.avatar) {
    return res.redirect('/images/community.png');
  }

  imageModule.getAvatar(req.community.avatar, req.query.format, function(err, fileStoreMeta, readable) {
    if (err) {
      logger.warn('Can not get community avatar : %s', err.message);
      return res.redirect('/images/community.png');
    }

    if (!readable) {
      logger.warn('Can not retrieve avatar stream for community %s', req.community._id);
      return res.redirect('/images/community.png');
    }

    if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
      return res.send(304);
    } else {
      res.header('Last-Modified', fileStoreMeta.uploadDate);
      res.status(200);
      return readable.pipe(res);
    }
  });
};

module.exports.getMine = function(req, res) {
  var user = req.user;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  communityModule.query({'members.user': user._id}, function(err, communities) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    async.map(communities, function(community, callback) {
      transform(community, req.user, function(transformed) {
        return callback(null, transformed);
      });
    }, function(err, results) {
      return res.json(200, results);
    });
  });
};

module.exports.getMembers = function(req, res) {
  var community = req.community;

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  var query = {};
  if (req.param('limit')) {
    var limit = parseInt(req.param('limit'));
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.param('offset')) {
    var offset = parseInt(req.param('offset'));
    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  communityModule.getMembers(community, query, function(err, members) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    res.header('X-ESN-Items-Count', req.community.members ? req.community.members.length : 0);
    var result = members.map(function(member) {
      return communityModule.userToMember(member);
    });
    return res.json(200, result || []);
  });
};

module.exports.getMember = function(req, res) {
  var community = req.community;
  var user = req.params.user_id;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User id is missing'}});
  }

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  communityModule.isMember(community, user, function(err, result) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }

    if (result) {
      return res.json(200);
    }
    return res.send(404);
  });
};

module.exports.join = function(req, res) {
  if (!ensureLoginCommunityAndUserId(req, res)) {
    return;
  }
  var community = req.community;
  var user = req.user;
  var targetUser = req.params.user_id;

  if (req.isCommunityManager) {

    if (user._id.equals(targetUser)) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Community Manager can not add himself to a community'}});
    }

    if (!communityModule.getMembershipRequest(community, {_id: targetUser})) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User did not request to join community'}});
    }

    communityModule.join(community, user, targetUser, 'manager', function(err) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
      }

      communityModule.cleanMembershipRequest(community, targetUser, function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
        }
        return res.send(204);
      });
    });

  } else {

    if (!user._id.equals(targetUser)) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Current user is not the target user'}});
    }

    if (req.community.type !== 'open') {
      var membershipRequest = communityModule.getMembershipRequest(community, user);
      if (!membershipRequest) {
        return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User was not invited to join community'}});
      }

      communityModule.join(community, user, user, null, function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
        }

        communityModule.cleanMembershipRequest(community, user, function(err) {
          if (err) {
            return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
          }
          return res.send(204);
        });
      });
    }
    else {
      communityModule.join(community, user, targetUser, 'user', function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
        }

        communityModule.cleanMembershipRequest(community, user, function(err) {
          if (err) {
            return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
          }
          return res.send(204);
        });
      });
    }
  }
};

module.exports.leave = function(req, res) {
  if (!ensureLoginCommunityAndUserId(req, res)) {
    return;
  }
  var community = req.community;
  var user = req.user;
  var targetUser = req.params.user_id;

  communityModule.leave(community, user, targetUser, function(err) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.send(204);
  });
};

module.exports.getMembershipRequests = function(req, res) {
  var community = req.community;

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  if (!req.isCommunityManager) {
    return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'Only community managers can get requests'}});
  }

  var query = {};
  if (req.param('limit')) {
    var limit = parseInt(req.param('limit'));
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.param('offset')) {
    var offset = parseInt(req.param('offset'));
    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  communityModule.getMembershipRequests(community, query, function(err, membershipRequests) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    res.header('X-ESN-Items-Count', req.community.membershipRequests ? req.community.membershipRequests.length : 0);
    var result = membershipRequests.map(function(request) {
      var result = communityModule.userToMember(request);
      result.workflow = request.workflow;
      result.timestamp = request.timestamp;
      return result;
    });
    return res.json(200, result || []);
  });
};

module.exports.addMembershipRequest = function(req, res) {
  if (!ensureLoginCommunityAndUserId(req, res)) {
    return;
  }
  var community = req.community;
  var userAuthor = req.user;
  var userTargetId = req.params.user_id;

  function addMembership(community, userAuthor, userTarget, workflow, actor) {
    communityModule.addMembershipRequest(community, userAuthor, userTarget, workflow, actor, function(err, community) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return transform(community, userAuthor, function(transformed) {
        return res.json(200, transformed);
      });
    });
  }

  if (req.isCommunityManager) {
    addMembership(community, userAuthor, userTargetId, communityModule.MEMBERSHIP_TYPE_INVITATION, 'manager');
  } else {
    addMembership(community, userAuthor, userTargetId, communityModule.MEMBERSHIP_TYPE_REQUEST, 'user');
  }
};

module.exports.removeMembershipRequest = function(req, res) {
  if (!ensureLoginCommunityAndUserId(req, res)) {
    return;
  }
  if (!req.isCommunityManager && !req.user._id.equals(req.params.user_id)) {
    return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'Current user is not the target user'}});
  }

  if (!req.community.membershipRequests || ! ('filter' in req.community.membershipRequests)) {
    return res.send(204);
  }

  var memberships = req.community.membershipRequests.filter(function(mr) {
    return mr.user.equals(req.params.user_id);
  });

  if (!memberships.length) {
    return res.send(204);
  }
  var membership = memberships[0];

  function onResponse(err, resp) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    }
    res.send(204);
  }

  /*
  *      workflow   |   isCommunityManager   |  What does it mean ?
  *      -----------------------------------------------------------
  *      INVITATION |           yes          | manager cancel the invitation of the user
  *      INVITATION |            no          | attendee declines the invitation
  *      REQUEST    |           yes          | manager refuses the user's request to enter the community
  *      REQUEST    |            no          | user cancels her request to enter the commity
  */

  if (req.isCommunityManager) {
    if (membership.workflow === communityModule.MEMBERSHIP_TYPE_INVITATION) {
      communityModule.cancelMembershipInvitation(req.community, membership, req.user, onResponse);
    } else {
      communityModule.refuseMembershipRequest(req.community, membership, req.user, onResponse);
    }
  } else {
    if (membership.workflow === communityModule.MEMBERSHIP_TYPE_INVITATION) {
      communityModule.declineMembershipInvitation(req.community, membership, req.user, onResponse);
    } else {
      communityModule.cancelMembershipRequest(req.community, membership, req.user, onResponse);
    }
  }
};

module.exports.getInvitablePeople = function(req, res) {
  var community = req.community;
  var user = req.user;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  var query = {
    limit: req.param('limit') || 5,
    search: req.param('search') || null,
    not_in_community: community
  };

  var domainIds = community.domain_ids.map(function(domainId) {
    return domainId;
  });

  if (query.search) {
    userDomain.getUsersSearch(domainIds, query, function(err, result) {
      if (err) {
        return res.json(500, { error: { status: 500, message: 'Server error', details: 'Error while searching members: ' + err.message}});
      }

      res.header('X-ESN-Items-Count', result.total_count);
      return res.json(200, result.list);
    });
  }
  else {
    userDomain.getUsersList(domainIds, query, function(err, result) {
      if (err) {
        return res.json(500, { error: { status: 500, message: 'Server error', details: 'Error while listing members: ' + err.message}});
      }

      res.header('X-ESN-Items-Count', result.total_count);
      return res.json(200, result.list);
    });
  }
};
