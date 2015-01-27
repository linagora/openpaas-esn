'use strict';

var collaborationModule = require('../../core/collaboration/index');
var userDomain = require('../../core/user/domain');
var memberAdapter = require('../../helpers/collaboration').memberAdapter;
var permission = require('../../core/collaboration/permission');
var userHelper = require('../../helpers/user');
var userModule = require('../../core/user');
var async = require('async');

function transform(collaboration, user, callback) {
  if (!collaboration) {
    return callback({});
  }

  var membershipRequest = collaborationModule.getMembershipRequest(collaboration, user);

  if (typeof(collaboration.toObject) === 'function') {
    collaboration = collaboration.toObject();
  }

  collaboration.members_count = collaboration.members ? collaboration.members.length : 0;
  if (membershipRequest) {
    collaboration.membershipRequest = membershipRequest.timestamp.creation.getTime();
  }

  collaborationModule.isMember(collaboration, {objectType: 'user', id: user._id + ''}, function(err, membership) {
    if (membership) {
      collaboration.member_status = 'member';
    } else {
      collaboration.member_status = 'none';
    }
    delete collaboration.members;
    delete collaboration.membershipRequests;
    return callback(collaboration);
  });
}

module.exports.searchWhereMember = function(req, res) {

  if (!req.query.objectType || !req.query.id) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'objectType and id query parameters are required'}});
  }

  collaborationModule.getCollaborationsForTuple({objectType: req.query.objectType, id: req.query.id}, function(err, collaborations) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
    }

    var tuple = {objectType: 'user', id: req.user._id};
    async.filter(collaborations, function(collaboration, callback) {

      permission.canRead(collaboration, tuple, function(err, canRead) {
        if (err) {
          return callback(false);
        }

        if (canRead) {
          return callback(true);
        }

        collaborationModule.isMember(collaboration, tuple, function(err, member) {
          return callback(err ? false : member);
        });
      });
    }, function(results) {
      async.map(results, function(element, callback) {
        transform(element, req.user, function(transformed) {
          return callback(null, transformed);
        });
      }, function(err, results) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
        }
        return res.json(200, results);
      });
    });
  });
};

function getMembers(req, res) {
  if (!req.collaboration) {
    return res.json(500, {error: {code: 500, message: 'Server error', details: 'Collaboration is mandatory here'}});
  }

  var query = {};
  if (req.query.limit) {
    var limit = parseInt(req.query.limit, 10);
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.query.offset) {
    var offset = parseInt(req.query.offset, 10);
    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  collaborationModule.getMembers(req.collaboration, req.params.objectType, query, function(err, members) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    }

    res.header('X-ESN-Items-Count', req.collaboration.members ? req.collaboration.members.length : 0);

    function format(member) {
      var result = Object.create(null);
      if (!member || !member.member) {
        return result;
      }

      result.objectType = member.objectType;
      result.id = member.id;

      var Adapter = memberAdapter(member.objectType);
      if (Adapter) {
        result[member.objectType] = new Adapter(member.member || member);
      } else {
        result[member.objectType] = member.member || member;
      }

      result.metadata = {
        timestamps: member.timestamps
      };

      return result;
    }

    var result = members.map(function(member) {
      return format(member);
    });

    return res.json(200, result || []);
  });
}
module.exports.getMembers = getMembers;

function getExternalCompanies(req, res) {
  if (!req.collaboration) {
    return res.json(500, {error: {code: 500, message: 'Server error', details: 'Collaboration is mandatory here'}});
  }

  var allCompanies = [];
  async.eachSeries(req.collaboration.members,
    function(member, callback) {
      if (member.member.objectType === 'user') {
        userModule.get(member.member.id, function(err, user) {
          if (err) {
            return callback(err);
          }
          if (!user) {
            return callback(new Error('Unexpected error while searching member.'));
          }
          userHelper.isInternal(user, function(err, isInternal) {
            if (err) {
              return callback(err);
            }
            if (isInternal) {
              return callback();
            }
            userModule.getCompanies(user, function(err, companies) {
              if (err) {
                return callback(err);
              }
              companies.forEach(function(company) {
                if (allCompanies.indexOf(company) === -1) {
                  allCompanies.push(company);
                }
              });
              return callback();
            });
          });
        });
      }
      else {
        return callback();
      }
    },
    function(err) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
      }
      if (req.query.search) {
        allCompanies = allCompanies.filter(function(company) {
          return company.indexOf(req.query.search) > -1;
        });
      }
      allCompanies = allCompanies.map(function(company) {
        return {
          objectType: 'company',
          id: company
        };
      });
      return res.json(200, allCompanies);
    }
  );
}
module.exports.getExternalCompanies = getExternalCompanies;

function getInvitablePeople(req, res) {
  var collaboration = req.collaboration;
  var user = req.user;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  if (!collaboration) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Collaboration is missing'}});
  }

  var query = {
    limit: req.param('limit') || 5,
    search: req.param('search') || null,
    not_in_collaboration: collaboration
  };

  var domainIds = collaboration.domain_ids.map(function(domainId) {
    return domainId;
  });

  var search = query.search ? userDomain.getUsersSearch : userDomain.getUsersList;
  search(domainIds, query, function(err, result) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server error', details: 'Error while searching invitable people: ' + err.message}});
    }

    res.header('X-ESN-Items-Count', result.total_count);
    return res.json(200, result.list);
  });
}
module.exports.getInvitablePeople = getInvitablePeople;

function ensureLoginCollaborationAndUserId(req, res) {
  var collaboration = req.collaboration;
  var user = req.user;

  if (!user) {
    res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
    return false;
  }

  if (!req.params || !req.params.user_id) {
    res.json(400, {error: {code: 400, message: 'Bad Request', details: 'The user_id parameter is missing'}});
    return false;
  }

  if (!collaboration) {
    res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
    return false;
  }
  return true;
}
module.exports.ensureLoginCollaborationAndUserId = ensureLoginCollaborationAndUserId;

function addMembershipRequest(req, res) {
  if (!ensureLoginCollaborationAndUserId(req, res)) {
    return;
  }
  var collaboration = req.collaboration;
  var userAuthor = req.user;
  var userTargetId = req.params.user_id;
  var objectType = req.params.objectType;

  var member = collaboration.members.filter(function(m) {
    return m.member.objectType === 'user' && m.member.id.equals(userTargetId);
  });

  if (member.length) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User is already member'}});
  }

  function addMembership(objectType, collaboration, userAuthor, userTarget, workflow, actor) {
    collaborationModule.addMembershipRequest(objectType, collaboration, userAuthor, userTarget, workflow, actor, function(err, collaboration) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return transform(collaboration, userAuthor, function(transformed) {
        return res.json(200, transformed);
      });
    });
  }

  if (req.isCollaborationManager) {
    addMembership(objectType, collaboration, userAuthor, userTargetId, collaborationModule.MEMBERSHIP_TYPE_INVITATION, 'manager');
  } else {
    addMembership(objectType, collaboration, userAuthor, userTargetId, collaborationModule.MEMBERSHIP_TYPE_REQUEST, 'user');
  }
}
module.exports.addMembershipRequest = addMembershipRequest;

function getMembershipRequests(req, res) {
  var collaboration = req.collaboration;

  if (!collaboration) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Collaboration is missing'}});
  }

  if (!req.isCollaborationManager) {
    return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'Only collaboration managers can get requests'}});
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

  collaborationModule.getMembershipRequests(req.params.objectType, collaboration, query, function(err, membershipRequests) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    res.header('X-ESN-Items-Count', req.collaboration.membershipRequests ? req.collaboration.membershipRequests.length : 0);
    var result = membershipRequests.map(function(request) {
      var result = collaborationModule.userToMember({member: request.user, timestamp: request.timestamp});
      result.workflow = request.workflow;
      result.timestamp = request.timestamp;
      return result;
    });
    return res.json(200, result || []);
  });
}
module.exports.getMembershipRequests = getMembershipRequests;

function join(req, res) {
  if (!ensureLoginCollaborationAndUserId(req, res)) {
    return;
  }

  var collaboration = req.collaboration;
  var user = req.user;
  var targetUserId = req.params.user_id;

  if (req.isCollaborationManager) {

    if (user._id.equals(targetUserId)) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Community Manager can not add himself to a collaboration'}});
    }

    if (!collaborationModule.getMembershipRequest(collaboration, {_id: targetUserId})) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User did not request to join collaboration'}});
    }

    collaborationModule.join(req.params.objectType, collaboration, user, targetUserId, 'manager', function(err) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
      }

      collaborationModule.cleanMembershipRequest(collaboration, targetUserId, function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
        }
        return res.send(204);
      });
    });

  } else {

    if (!user._id.equals(targetUserId)) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Current user is not the target user'}});
    }

    if (req.collaboration.type !== 'open') {
      var membershipRequest = collaborationModule.getMembershipRequest(collaboration, user);
      if (!membershipRequest) {
        return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User was not invited to join collaboration'}});
      }

      collaborationModule.join(req.params.objectType, collaboration, user, user, null, function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
        }

        collaborationModule.cleanMembershipRequest(collaboration, user, function(err) {
          if (err) {
            return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
          }
          return res.send(204);
        });
      });
    } else {
      collaborationModule.join(req.params.objectType, collaboration, user, targetUserId, 'user', function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
        }

        collaborationModule.cleanMembershipRequest(collaboration, user, function(err) {
          if (err) {
            return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
          }
          return res.send(204);
        });
      });
    }
  }
}
module.exports.join = join;

function leave(req, res) {
  if (!ensureLoginCollaborationAndUserId(req, res)) {
    return;
  }
  var collaboration = req.collaboration;
  var user = req.user;
  var targetUserId = req.params.user_id;

  collaborationModule.leave(req.params.objectType, collaboration, user, targetUserId, function(err) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.send(204);
  });
}
module.exports.leave = leave;

function removeMembershipRequest(req, res) {
  if (!ensureLoginCollaborationAndUserId(req, res)) {
    return;
  }
  if (!req.isCollaborationManager && !req.user._id.equals(req.params.user_id)) {
    return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'Current user is not the target user'}});
  }

  if (!req.collaboration.membershipRequests || ! ('filter' in req.collaboration.membershipRequests)) {
    return res.send(204);
  }

  var memberships = req.collaboration.membershipRequests.filter(function(mr) {
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

  if (req.isCollaborationManager) {
    if (membership.workflow === collaborationModule.MEMBERSHIP_TYPE_INVITATION) {
      collaborationModule.cancelMembershipInvitation(req.params.objectType, req.collaboration, membership, req.user, onResponse);
    } else {
      collaborationModule.refuseMembershipRequest(req.params.objectType, req.collaboration, membership, req.user, onResponse);
    }
  } else {
    if (membership.workflow === collaborationModule.MEMBERSHIP_TYPE_INVITATION) {
      collaborationModule.declineMembershipInvitation(req.params.objectType, req.collaboration, membership, req.user, onResponse);
    } else {
      collaborationModule.cancelMembershipRequest(req.params.objectType, req.collaboration, membership, req.user, onResponse);
    }
  }
}
module.exports.removeMembershipRequest = removeMembershipRequest;

function getMember(req, res) {
  var collaboration = req.collaboration;

  if (!collaboration) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Collaboration is missing'}});
  }

  collaborationModule.isMember(collaboration, {objectType: 'user', id: req.params.user_id}, function(err, result) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    }

    if (result) {
      return res.json(200);
    }
    return res.send(404);
  });
}
module.exports.getMember = getMember;
