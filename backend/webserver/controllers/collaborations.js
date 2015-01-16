'use strict';

var collaborationModule = require('../../core/collaboration/index');
var userDomain = require('../../core/user/domain');
var Member = require('../../helpers/collaboration').Member;
var permission = require('../../core/collaboration/permission');
var userHelper = require('../../helpers/user');
var userModule = require('../../core/user');
var async = require('async');

function transform(collaboration, user, callback) {
  if (!collaboration) {
    return callback({});
  }

  if (typeof(collaboration.toObject) === 'function') {
    collaboration = collaboration.toObject();
  }

  collaboration.members_count = collaboration.members ? collaboration.members.length : 0;
  delete collaboration.members;
  delete collaboration.membershipRequests;
  return callback(collaboration);
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

      result.user = new Member(member.member || member);

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

function transform(collaboration, user, callback) {
  if (!collaboration) {
    return {};
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

function addMembershipRequest(req, res) {
  if (!ensureLoginCollaborationAndUserId(req, res)) {
    return;
  }
  var collaboration = req.collaboration;
  var userAuthor = req.user;
  var userTargetId = req.params.user_id;

  var member = collaboration.members.filter(function(m) {
    return m.member.objectType === 'user' && m.member.id.equals(userTargetId);
  });

  if (member.length) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User is already member'}});
  }

  function addMembership(collaboration, userAuthor, userTarget, workflow, actor) {
    collaborationModule.addMembershipRequest(collaboration, userAuthor, userTarget, workflow, actor, function(err, collaboration) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return transform(collaboration, userAuthor, function(transformed) {
        return res.json(200, transformed);
      });
    });
  }

  if (req.isCollaborationManager) {
    addMembership(collaboration, userAuthor, userTargetId, collaborationModule.MEMBERSHIP_TYPE_INVITATION, 'manager');
  } else {
    addMembership(collaboration, userAuthor, userTargetId, collaborationModule.MEMBERSHIP_TYPE_REQUEST, 'user');
  }
}
module.exports.addMembershipRequest = addMembershipRequest;
