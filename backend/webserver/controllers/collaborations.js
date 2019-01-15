'use strict';

const async = require('async');
const collaborationModule = require('../../core/collaboration');
const userDomain = require('../../core/user/domain');
const imageModule = require('../../core/image');
const logger = require('../../core/logger');

const permission = collaborationModule.permission;

module.exports = {
  searchWhereMember,
  getWritable,
  getMembers,
  getInvitablePeople,
  addMembershipRequest,
  getMembershipRequests,
  join,
  leave,
  removeMembershipRequest,
  getMember,
  getAvatar
};

function transform(collaboration, user, callback) {
  if (!collaboration) {
    return callback({});
  }

  const membershipRequest = collaborationModule.member.getMembershipRequest(collaboration, user);

  if (typeof collaboration.toObject === 'function') {
    collaboration = collaboration.toObject();
  }

  collaboration.members_count = collaboration.members ? collaboration.members.length : 0;
  if (membershipRequest) {
    collaboration.membershipRequest = membershipRequest.timestamp.creation.getTime();
  }

  const userTuple = {objectType: 'user', id: user.id};

  collaborationModule.member.isMember(collaboration, userTuple, (err, membership) => {
    if (membership) {
      collaboration.member_status = 'member';
    } else {
      collaborationModule.member.isIndirectMember(collaboration, userTuple, (err, indirect) => {
        if (indirect) {
          collaboration.member_status = 'indirect';
        } else {
          collaboration.member_status = 'none';
        }
      });
    }

    permission.canWrite(collaboration, userTuple, (err, writable) => {
      collaboration.writable = writable || false;
      delete collaboration.members;
      delete collaboration.membershipRequests;

      return callback(collaboration);
    });
  });
}

function searchWhereMember(req, res) {
  collaborationModule.getCollaborationsForTuple({objectType: req.query.objectType, id: req.query.id}, (err, collaborations) => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server error', details: err.message}});
    }

    const tuple = {objectType: 'user', id: req.user._id};

    async.filter(
      collaborations,
      (collaboration, callback) => permission.canRead(collaboration, tuple, callback),
      (err, results) => {
        async.map(
          results,
          (element, callback) => transform(element, req.user, transformed => callback(null, transformed)),
          (err, results) => {
            if (err) {
              return res.status(500).json({error: {code: 500, message: 'Server error', details: err.message}});
            }

            return res.status(200).json(results);
          });
      });
  });
}

function getWritable(req, res) {
  const user = req.user;

  collaborationModule.getCollaborationsForUser(user._id, {writable: true}, (err, collaborations) => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
    }
    async.map(collaborations, (collaboration, callback) => {
      transform(collaboration, req.user, transformed => callback(null, transformed));
    }, (err, results) => res.status(200).json(results));
  });
}

function getMembers(req, res) {
  const query = {};

  if (req.query.limit) {
    const limit = parseInt(req.query.limit, 10);

    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.query.offset) {
    const offset = parseInt(req.query.offset, 10);

    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  if (req.query.objectTypeFilter) {
    query.objectTypeFilter = req.query.objectTypeFilter;
  }

  if (req.query.idFilter) {
    query.idFilter = req.query.idFilter;
  }

  collaborationModule.member.getMembers(req.collaboration, req.params.objectType, query, (err, members) => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
    }

    res.header('X-ESN-Items-Count', members.total_count || 0);

    function format(member) {
      if (!member || !member.member) {
        return null;
      }

      return {
        objectType: member.objectType,
        id: member.id,
        [member.objectType]: collaborationModule.memberDenormalize.denormalize(member.objectType, member.member),
        metadata: {
          timestamps: member.timestamps
        }
      };
    }

    const result = members.map(format).filter(Boolean);

    return res.status(200).json(result);
  });
}

function getInvitablePeople(req, res) {
  const collaboration = req.collaboration;
  const excludeUserIds = (req.body.exclude && req.body.exclude.users) || [];
  const query = {
    limit: req.query.limit || 5,
    search: req.query.search || null,
    not_in_collaboration: collaboration,
    excludeUserIds
  };
  const domainIds = collaboration.domain_ids.slice(0);
  const search = query.search ? userDomain.getUsersSearch : userDomain.getUsersList;

  search(domainIds, query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: { status: 500, message: 'Server error', details: 'Error while searching invitable people: ' + err.message}});
    }

    res.header('X-ESN-Items-Count', result.total_count);

    return res.status(200).json(result.list);
  });
}

function addMembershipRequest(req, res) {
  const collaboration = req.collaboration;
  const userAuthor = req.user;
  const userTargetId = req.params.user_id;
  const objectType = req.params.objectType;

  const member = collaboration.members.filter(member => (
    member.member.objectType === 'user' && member.member.id.equals(userTargetId)
  ));

  if (member.length) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'User is already member'}});
  }

  function addMembership(objectType, collaboration, userAuthor, userTarget, workflow, actor) {
    collaborationModule.member.addMembershipRequest(objectType, collaboration, userAuthor, userTarget, workflow, actor, (err, collaboration) => {
      if (err) {
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }

      return transform(collaboration, userAuthor, transformed => res.status(200).json(transformed));
    });
  }

  if (req.isCollaborationManager) {
    addMembership(objectType, collaboration, userAuthor, userTargetId, collaborationModule.member.MEMBERSHIP_TYPE_INVITATION, 'manager');
  } else {
    addMembership(objectType, collaboration, userAuthor, userTargetId, collaborationModule.member.MEMBERSHIP_TYPE_REQUEST, 'user');
  }
}

function getMembershipRequests(req, res) {
  const collaboration = req.collaboration;

  if (!req.isCollaborationManager) {
    return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Only collaboration managers can get requests'}});
  }

  const query = {};

  if (req.query.limit) {
    const limit = parseInt(req.query.limit, 10);

    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.query.offset) {
    const offset = parseInt(req.query.offset, 10);

    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  collaborationModule.member.getMembershipRequests(req.params.objectType, collaboration, query, (err, membershipRequests) => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
    }
    res.header('X-ESN-Items-Count', req.collaboration.membershipRequests ? req.collaboration.membershipRequests.length : 0);
    const result = membershipRequests.map(request => {
      const result = collaborationModule.userToMember({member: request.user, timestamp: request.timestamp});

      result.workflow = request.workflow;
      result.timestamp = request.timestamp;

      return result;
    });

    return res.status(200).json(result || []);
  });
}

function join(req, res) {
  const collaboration = req.collaboration;
  const user = req.user;
  const targetUserId = req.params.user_id;

  if (req.isCollaborationManager) {

    if (user._id.equals(targetUserId)) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Collaboration manager can not add himself to a collaboration'}});
    }

    if (!req.query.withoutInvite && !collaborationModule.member.getMembershipRequest(collaboration, {_id: targetUserId})) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'User did not request to join collaboration'}});
    }

    collaborationModule.member.join(req.params.objectType, collaboration, user, targetUserId, 'manager', err => {
      if (err) {
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
      }

      collaborationModule.member.cleanMembershipRequest(collaboration, targetUserId, err => {
        if (err) {
          return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
        }

        return res.status(204).end();
      });
    });

  } else {
    if (!user._id.equals(targetUserId)) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Current user is not the target user'}});
    }

    if (req.collaboration.type !== collaborationModule.CONSTANTS.COLLABORATION_TYPES.OPEN) {
      const membershipRequest = collaborationModule.member.getMembershipRequest(collaboration, user);

      if (!membershipRequest) {
        return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'User was not invited to join collaboration'}});
      }

      collaborationModule.member.join(req.params.objectType, collaboration, user, user, null, err => {
        if (err) {
          return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
        }

        collaborationModule.member.cleanMembershipRequest(collaboration, user, err => {
          if (err) {
            return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
          }

          return res.status(204).end();
        });
      });
    } else {
      collaborationModule.member.join(req.params.objectType, collaboration, user, targetUserId, 'user', err => {
        if (err) {
          return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
        }

        collaborationModule.member.cleanMembershipRequest(collaboration, user, err => {
          if (err) {
            return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
          }

          return res.status(204).end();
        });
      });
    }
  }
}

function leave(req, res) {
  const collaboration = req.collaboration;
  const user = req.user;
  const targetUserId = req.params.user_id;

  collaborationModule.member.leave(req.params.objectType, collaboration, user, targetUserId, err => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
    }

    return res.status(204).end();
  });
}

function removeMembershipRequest(req, res) {
  if (!req.isCollaborationManager && !req.user._id.equals(req.params.user_id)) {
    return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Current user is not the target user'}});
  }

  if (!req.collaboration.membershipRequests || !('filter' in req.collaboration.membershipRequests)) {
    return res.status(204).end();
  }

  const memberships = req.collaboration.membershipRequests.filter(mr => mr.user.equals(req.params.user_id));

  if (!memberships.length) {
    return res.status(204).end();
  }
  const membership = memberships[0];

  function onResponse(err) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
    }
    res.status(204).end();
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
    if (membership.workflow === collaborationModule.member.MEMBERSHIP_TYPE_INVITATION) {
      collaborationModule.member.cancelMembershipInvitation(req.params.objectType, req.collaboration, membership, req.user, onResponse);
    } else {
      collaborationModule.member.refuseMembershipRequest(req.params.objectType, req.collaboration, membership, req.user, onResponse);
    }
  } else if (membership.workflow === collaborationModule.member.MEMBERSHIP_TYPE_INVITATION) {
    collaborationModule.member.declineMembershipInvitation(req.params.objectType, req.collaboration, membership, req.user, onResponse);
  } else {
    collaborationModule.member.cancelMembershipRequest(req.params.objectType, req.collaboration, membership, req.user, onResponse);
  }
}

function getMember(req, res) {
  const collaboration = req.collaboration;

  collaborationModule.member.isMember(collaboration, {objectType: 'user', id: req.params.user_id}, (err, result) => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
    }

    if (result) {
      return res.status(200).end();
    }

    return res.status(404).end();
  });
}

function getAvatar(req, res) {
  if (!req.collaboration) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'Community not found'});
  }

  if (!req.collaboration.avatar) {
    return res.redirect('/images/collaboration.png');
  }

  imageModule.getAvatar(req.collaboration.avatar, req.query.format, (err, fileStoreMeta, readable) => {
    if (err) {
      logger.warn('Can not get collaboration avatar : %s', err.message);

      return res.redirect('/images/collaboration.png');
    }

    if (!readable) {
      logger.warn('Can not retrieve avatar stream for collaboration %s', req.collaboration._id);

      return res.redirect('/images/collaboration.png');
    }

    if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
      return res.status(304).end();
    }

    res.header('Last-Modified', fileStoreMeta.uploadDate);
    res.status(200);

    return readable.pipe(res);
  });
}
