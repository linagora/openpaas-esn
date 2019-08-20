'use strict';

const _ = require('lodash');
const async = require('async');
const localpubsub = require('../../pubsub').local;
const globalpubsub = require('../../pubsub').global;
const tupleModule = require('../../tuple');
const memberResolver = require('./resolver');

const CONSTANTS = require('../constants');
const MEMBERSHIP_TYPE_REQUEST = CONSTANTS.MEMBERSHIP_TYPES.request;
const MEMBERSHIP_TYPE_INVITATION = CONSTANTS.MEMBERSHIP_TYPES.invitation;
const WORKFLOW_NOTIFICATIONS_TOPIC = CONSTANTS.WORKFLOW_NOTIFICATIONS_TOPIC;

module.exports = function(collaborationModule) {
  return {
    addMember,
    addMembers,
    addMembershipRequest,
    cancelMembershipInvitation,
    cancelMembershipRequest,
    cleanMembershipRequest,
    countMembers,
    declineMembershipInvitation,
    fetchMember,
    getManagers,
    getMembers,
    getMemberAndMembershipRequestIds,
    getMembershipRequest,
    getMembershipRequests,
    isIndirectMember,
    isManager,
    isMember,
    join,
    leave,
    refuseMembershipRequest,
    removeMembers,
    supportsMemberShipRequests,
    WORKFLOW_NOTIFICATIONS_TOPIC,
    MEMBERSHIP_TYPE_REQUEST,
    MEMBERSHIP_TYPE_INVITATION
  };

  function addMember(collaboration, member, callback) {
    addMembers(collaboration, [member], callback);
  }

  function addMembers(collaboration, members, callback) {
    if (!collaboration || !members) {
      return callback(new Error('Collaboration and members are required'));
    }

    if (!collaboration.save) {
      return callback(new Error('addMembers(): first argument (collaboration) must be a collaboration mongoose model'));
    }

    const verifiedMembers = _.uniqWith(members, _.isEqual)
      .filter(member => !isMember(member))
      .map(verifyMember);

    if (!verifiedMembers.length) {
      // return the collaboration with 0 as collaboration document remains not updated
      return callback(null, collaboration, 0);
    }

    const verificationError = verifiedMembers.find(member => member instanceof Error);

    if (verificationError) {
      return callback(verificationError);
    }

    _.each(verifiedMembers, member => {
      collaboration.members.push({
        member,
        status: CONSTANTS.STATUS.joined
      });
    });

    collaboration.save(callback);

    function verifyMember(member) {
      if (!member.id || !member.objectType) {
        return new Error('member must be a tuple{id, objectType}');
      }

      if (!tupleModule[member.objectType]) {
        return new Error(`${member.objectType} is not a supported tuple`);
      }

      try {
        member = tupleModule.get(member.objectType, member.id);
      } catch (error) {
        return new Error(`Invalid tuple id: ${error.message}`);
      }

      return member;
    }

    function isMember(member) {
      return collaboration.members.find(ele => ((
        ele.member.objectType === member.objectType &&
        ele.member.id.equals ? ele.member.id.equals(member.id) : ele.member.id === member.id)
      ));
    }
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

    return Model.aggregate([
      {$match: {_id: id}},
      {$unwind: '$members'},
      {$group: {_id: null, number: {$sum: 1 }}}
    ]).exec((err, result) => {
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

  function getManagers(objectType, collaboration, callback) {
    const id = collaboration._id || collaboration;
    const Model = collaborationModule.getModel(objectType);

    if (!Model) {
      return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
    }

    // TODO Right now creator is the only manager. It will change in the future.
    Model.findById(id).populate('creator').exec((err, collaboration) => {
      // there is no creator on the "general" channel in chat :-(
      const response = collaboration && collaboration.creator ? [collaboration.creator] : [];
      callback(err, response);
    });
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

      if (query.idFilter) {
        members = members.filter(m => String(m.member.id) === String(query.idFilter));
      }

      const total_count = members.length;

      members = members.slice(offset, offset + limit);

      async.map(members, function(member, callback) {
        return fetchMember(member.member, function(err, loaded) {
          member = member.toObject();
          member.objectType = member.member.objectType;
          member.id = member.member.id;

          if (loaded) {
            member.member = loaded;
          }

          return callback(null, member);
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

    addMember(collaboration, member, (err, updated, numAffected) => {
      if (err) {
        return callback(err);
      }

      if (numAffected) {
        localpubsub.topic('collaboration:join').forward(globalpubsub, {
          author: userAuthor_id,
          target: userTarget_id,
          actor: actor || 'user',
          collaboration: {objectType: objectType, id: id}
        });
      }

      callback(null, updated);
    });
  }

  function leave(objectType, collaboration, userAuthor, userTarget, callback) {
    const userAuthor_id = String(userAuthor._id || userAuthor);
    const userTarget_id = String(userTarget._id || userTarget);
    const member = { objectType: 'user', id: userTarget_id };

    collaboration = {
      id: collaboration._id || collaboration,
      objectType
    };

    removeMembers(collaboration, [member], (err, updated) => {
      if (err) {
        return callback(err);
      }

      localpubsub.topic('collaboration:leave').forward(globalpubsub, {
        author: userAuthor_id,
        target: userTarget_id,
        collaboration
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

  function removeMembers(collaboration, members, callback) {
    if (!collaboration || !Array.isArray(members)) {
      return callback(new Error('Collaboration and members are required'));
    }

    if (members.length === 0) {
      return callback();
    }

    members = members.map(member => {
      try {
        return tupleModule.get(member.objectType, member.id);
      } catch (err) {
        return null;
      }
    });

    if (members.some(member => !member)) {
      return callback(new Error('Some members are invalid or unsupported tuples'));
    }

    const Model = collaborationModule.getModel(collaboration.objectType);
    const selections = members.map(member => ({
      'member.id': member.id, 'member.objectType': member.objectType
    }));

    Model.update(
      { _id: collaboration.id },
      {
        $pull: {
          members: { $or: selections }
        }
      },
      callback
    );
  }

  function supportsMemberShipRequests(collaboration) {
    if (!collaboration || !collaboration.type) {
      return false;
    }

    return collaboration.type === CONSTANTS.COLLABORATION_TYPES.RESTRICTED || collaboration.type === CONSTANTS.COLLABORATION_TYPES.PRIVATE;
  }

/**
 * Get IDs of members and membership requests from a collaboration
 *
 * @param {object} collaboration detailed information of collaboration
 */

  function getMemberAndMembershipRequestIds(collaboration) {
    const results = [];

    collaboration.members.forEach(item => {
      results.push(item.member.id);
    });

    collaboration.membershipRequests.forEach(member => {
      results.push(member.user);
    });

    return results;
  }
};
