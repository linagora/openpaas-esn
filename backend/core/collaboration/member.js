'use strict';

const _ = require('lodash');
const async = require('async');
const localpubsub = require('../pubsub').local;
const globalpubsub = require('../pubsub').global;
const tupleModule = require('../tuple');
const memberResolver = require('./member/resolver');

const CONSTANTS = require('./constants');
const MEMBERSHIP_TYPE_REQUEST = CONSTANTS.MEMBERSHIP_TYPES.request;
const MEMBERSHIP_TYPE_INVITATION = CONSTANTS.MEMBERSHIP_TYPES.invitation;
const WORKFLOW_NOTIFICATIONS_TOPIC = CONSTANTS.WORKFLOW_NOTIFICATIONS_TOPIC;

module.exports = function(collaborationModule) {
  return {
    addMember,
    addMembershipRequest,
    cancelMembershipInvitation,
    cancelMembershipRequest,
    cleanMembershipRequest,
    countMembers,
    declineMembershipInvitation,
    fetchMember,
    getManagers,
    getMembers,
    getMembershipRequest,
    getMembershipRequests,
    isIndirectMember,
    isManager,
    isMember,
    join,
    leave,
    refuseMembershipRequest,
    supportsMemberShipRequests,
    WORKFLOW_NOTIFICATIONS_TOPIC,
    MEMBERSHIP_TYPE_REQUEST,
    MEMBERSHIP_TYPE_INVITATION
  };

  function addMember(target, author, member, callback) {
    if (!target || !member) {
      return callback(new Error('Collaboration and member are required'));
    }

    if (!target.save) {
      return callback(new Error('addMember(): first argument (target) must be a collaboration mongoose model'));
    }

    if (!member.id || !member.objectType) {
      return callback(new Error('member must be a tuple{id, objectType}'));
    }

    const isMemberOf = target.members.filter(m => ((m.member.id.equals ? m.member.id.equals(member.id) : m.member.id === member.id) && m.member.objectType === member.objectType));

    if (isMemberOf.length) {
      return callback(null, target);
    }

    member = tupleModule.get(member.objectType, member.id);
    if (!member) {
      return callback(new Error('Unsupported tuple'));
    }

    target.members.push({member: member, status: CONSTANTS.STATUS.joined});
    target.save((err, update) => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic(target.objectType + ':member:add').forward(globalpubsub, {
        author: author,
        target: target,
        member: member
      });

      callback(null, update);
    });
  }

  function addMembershipRequest(objectType, collaboration, userAuthor, userTarget, workflow, actor, callback) {
    if (!userAuthor) {
      return callback(new Error('Author user object is required'));
    }

    if (!userTarget) {
      return callback(new Error('Target user object is required'));
    }

    if (!collaboration) {
      return callback(new Error('Collaboration object is required'));
    }

    const userAuthorId = userAuthor._id || userAuthor;
    const userTargetId = userTarget._id || userTarget;
    const topic = WORKFLOW_NOTIFICATIONS_TOPIC[workflow];

    if (!workflow) {
      return callback(new Error('Workflow string is required'));
    }

    if (!topic) {
      return callback(new Error('Invalid workflow, must be in ' + _.keys(WORKFLOW_NOTIFICATIONS_TOPIC)));
    }

    if (workflow !== 'invitation' && !supportsMemberShipRequests(collaboration)) {
      return callback(new Error('Only Restricted and Private collaborations allow membership requests.'));
    }

    isMember(collaboration, {objectType: 'user', id: userTargetId}, (err, isMember) => {
      if (err) {
        return callback(err);
      }

      if (isMember) {
        return callback(new Error('User is already member of the collaboration.'));
      }

      const previousRequests = collaboration.membershipRequests.filter(request => {
        const requestUserId = request.user._id || request.user;

        return requestUserId.equals(userTargetId);
      });

      if (previousRequests.length > 0) {
        return callback(null, collaboration);
      }

      collaboration.membershipRequests.push({user: userTargetId, workflow: workflow});

      collaboration.save((err, collaborationSaved) => {
        if (err) {
          return callback(err);
        }

        localpubsub.topic(topic).forward(globalpubsub, {
          author: userAuthorId,
          target: userTargetId,
          collaboration: {objectType: objectType, id: collaboration._id},
          workflow: workflow,
          actor: actor || 'user'
        });

        callback(null, collaborationSaved);
      });
    });
  }

  function cancelMembershipInvitation(objectType, collaboration, membership, manager, callback) {
    cleanMembershipRequest(collaboration, membership.user, err => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:membership:invitation:cancel').forward(globalpubsub, {
        author: manager._id,
        target: membership.user,
        membership: membership,
        collaboration: {objectType: objectType, id: collaboration._id}
      });

      callback(err, collaboration);
    });
  }

  function cancelMembershipRequest(objectType, collaboration, membership, user, callback) {
    cleanMembershipRequest(collaboration, membership.user, err => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:membership:request:cancel').forward(globalpubsub, {
        author: user._id,
        target: collaboration._id,
        membership: membership,
        collaboration: {objectType: objectType, id: collaboration._id}
      });

      callback(err, collaboration);
    });
  }

  function cleanMembershipRequest(collaboration, user, callback) {
    if (!user) {
      return callback(new Error('User author object is required'));
    }

    if (!collaboration) {
      return callback(new Error('Collaboration object is required'));
    }

    const userId = user._id || user;
    const otherUserRequests = collaboration.membershipRequests.filter(request => {
      const requestUserId = request.user._id || request.user;

      return !requestUserId.equals(userId);
    });

    collaboration.membershipRequests = otherUserRequests;
    collaboration.save(callback);
  }

  function countMembers(objectType, id, callback) {
    const Model = collaborationModule.getModel(objectType);

    if (!Model) {
      return callback(new Error(`Collaboration model ${objectType} is unknown`));
    }

    return Model.aggregate(
      {$match: {_id: id}},
      {$unwind: '$members'},
      {$group: {_id: null, number: {$sum: 1 }}}).exec((err, result) => {
        if (err) {
          return callback(err);
        }

        callback(null, result && result.length ? result[0].number : 0);
      });
   }

  function declineMembershipInvitation(objectType, collaboration, membership, user, callback) {
    cleanMembershipRequest(collaboration, membership.user, err => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:membership:invitation:decline').forward(globalpubsub, {
        author: user._id,
        target: collaboration._id,
        membership: membership,
        collaboration: {objectType: objectType, id: collaboration._id}
      });

      callback(err, collaboration);
    });
  }

  function fetchMember(tuple, callback) {
    if (!tuple) {
      return callback(new Error('Member tuple is required'));
    }

    memberResolver.resolve(tuple)
      .then(
        member => callback(null, member),
        err => callback(err)
      );
  }

  function getManagers(objectType, collaboration, query, callback) {
    const id = collaboration._id || collaboration;
    const Model = collaborationModule.getModel(objectType);

    if (!Model) {
      return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
    }

    // TODO Right now creator is the only manager. It will change in the future.
    // query = query ||  {};
    // q.slice('managers', [query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT]);
    Model.findById(id).populate('creator').exec((err, collaboration) => callback(err, collaboration ? [collaboration.creator] : []));
  }

  function getMembers(collaboration, objectType, query = {}, callback) {
    const id = collaboration._id || collaboration;
    const Model = collaborationModule.getModel(objectType);

    if (!Model) {
      return callback(new Error(`Collaboration model ${collaboration.objectType} is unknown`));
    }

    Model.findById(id, (err, collaboration) => {
      if (err) {
        return callback(err);
      }

      const offset = query.offset || CONSTANTS.DEFAULT_OFFSET;
      const limit = query.limit || CONSTANTS.DEFAULT_LIMIT;
      let members = collaboration.members;

      if (query.objectTypeFilter) {
        let operation;

        if (query.objectTypeFilter[0] === '!') {
          const objectTypeFilter = query.objectTypeFilter.substr(1);

          operation = function(m) { return m.member.objectType !== objectTypeFilter; };
        } else {
          operation = function(m) { return m.member.objectType === query.objectTypeFilter; };
        }

        members = members.filter(operation);
      }

      const total_count = members.length;

      members = members.slice(offset, offset + limit);

      async.map(members, function(m, callback) {
        return fetchMember(m.member, function(err, loaded) {
          m.objectType = m.member.objectType;
          m.id = m.member.id;

          if (loaded) {
            m.member = loaded;
          }

          return callback(null, m);
        });
      }, (err, members) => {
        members.total_count = total_count;
        callback(err, members);
      });
    });
  }

  function getMembershipRequest(collaboration, user) {
    if (!collaboration.membershipRequests) {
      return false;
    }

    const mr = collaboration.membershipRequests.filter(mr => mr.user.equals(user._id));

    return mr.pop();
  }

  function getMembershipRequests(objectType, objetId, query = {}, callback) {
    const Model = collaborationModule.getModel(objectType);

    if (!Model) {
      return callback(new Error(`Collaboration model ${objectType} is unknown`));
    }

    const q = Model.findById(objetId);

    q.slice('membershipRequests', [query.offset || CONSTANTS.DEFAULT_OFFSET, query.limit || CONSTANTS.DEFAULT_LIMIT]);
    q.populate('membershipRequests.user');
    q.exec(function(err, collaboration) {
      if (err) {
        return callback(err);
      }

      callback(null, collaboration ? collaboration.membershipRequests : []);
    });
  }

  function isIndirectMember(collaboration, tuple, callback) {
    if (!collaboration || !collaboration._id) {
      return callback(new Error('Collaboration object is required'));
    }

    function isInnerMember(members, tupleToFind, callback) {
      async.some(members, (tuple, callback) => {
        const member = tuple.member;

        if (!collaborationModule.isCollaboration(member)) {
          return callback(null, String(member.id) === String(tupleToFind.id) && member.objectType === tupleToFind.objectType);
        }

        collaborationModule.queryOne(member.objectType, {_id: member.id}, (err, collaboration) => {
          if (err) {
            return callback(null, false);
          }

          isInnerMember(collaboration.members, tupleToFind, callback);
        });
      }, callback);
    }

    return isInnerMember(collaboration.members, tuple, callback);
  }

  function isManager(objectType, collaboration, user, callback) {
    const id = collaboration._id || collaboration;
    const user_id = user._id || user;
    const Model = collaborationModule.getModel(objectType);

    if (!Model) {
      return callback(new Error(`Collaboration model ${objectType} is unknown`));
    }

    Model.findOne({_id: id, creator: user_id}, (err, result) => callback(err, !!result));
  }

  function isMember(collaboration, tuple, callback) {
    if (!collaboration || !collaboration._id) {
      return callback(new Error('Collaboration object is required'));
    }

    const isInMembersArray = collaboration.members.some(m => m.member.objectType === tuple.objectType && String(m.member.id) === String(tuple.id));

    callback(null, isInMembersArray);
  }

  function join(objectType, collaboration, userAuthor, userTarget, actor, callback) {
    const id = collaboration._id || collaboration;
    const userAuthor_id = userAuthor._id || userAuthor;
    const userTarget_id = userTarget._id || userTarget;
    const member = {
      objectType: 'user',
      id: userTarget_id
    };

    addMember(collaboration, userAuthor, member, (err, updated) => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:join').forward(globalpubsub, {
        author: userAuthor_id,
        target: userTarget_id,
        actor: actor || 'user',
        collaboration: {objectType: objectType, id: id}
      });

      callback(null, updated);
    });
  }

  function leave(objectType, collaboration, userAuthor, userTarget, callback) {
    const id = collaboration._id || collaboration;
    const userAuthor_id = userAuthor._id || userAuthor;
    const userTarget_id = userTarget._id || userTarget;
    const selection = { 'member.objectType': 'user', 'member.id': userTarget_id };
    const Model = collaborationModule.getModel(objectType);

    Model.update({ _id: id, members: {$elemMatch: selection} }, { $pull: {members: selection} }, (err, updated) => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:leave').forward(globalpubsub, {
        author: userAuthor_id,
        target: userTarget_id,
        collaboration: {objectType: objectType, id: id}
      });

      callback(null, updated);
    });
  }

  function refuseMembershipRequest(objectType, collaboration, membership, manager, callback) {
    cleanMembershipRequest(collaboration, membership.user, err => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:membership:request:refuse').forward(globalpubsub, {
        author: manager._id,
        target: membership.user,
        membership: membership,
        collaboration: {objectType: objectType, id: collaboration._id}
      });

      callback(err, collaboration);
    });
  }

  function supportsMemberShipRequests(collaboration) {
    if (!collaboration || !collaboration.type) {
      return false;
    }

    return collaboration.type === CONSTANTS.COLLABORATION_TYPES.RESTRICTED || collaboration.type === CONSTANTS.COLLABORATION_TYPES.PRIVATE;
  }
};
