const mongoose = require('mongoose');
const Community = mongoose.model('Community');
const User = mongoose.model('User');
const { getDomainAdministrators } = require('../domain');
const collaborationModule = require('../collaboration');
const { OBJECT_TYPE, DEFAULT_OFFSET, DEFAULT_LIMIT } = require('./constants');
const MEMBERSHIP_TYPE_REQUEST = 'request';
const MEMBERSHIP_TYPE_INVITATION = 'invitation';

module.exports = {
  addMembershipRequest,
  cancelMembershipInvitation,
  cancelMembershipRequest,
  cleanMembershipRequest,
  declineMembershipInvitation,
  getManagers,
  getMembers,
  getMembershipRequest,
  getMembershipRequests,
  isManager,
  isMember,
  isIndirectMember,
  join,
  leave,
  refuseMembershipRequest,
  MEMBERSHIP_TYPE_REQUEST,
  MEMBERSHIP_TYPE_INVITATION
};

function addMembershipRequest(community, userAuthor, userTarget, workflow, actor, callback) {
  collaborationModule.member.addMembershipRequest(OBJECT_TYPE, community, userAuthor, userTarget, workflow, actor, callback);
}

function cancelMembershipInvitation(community, membership, manager, onResponse) {
  collaborationModule.member.cancelMembershipInvitation(OBJECT_TYPE, community, membership, manager, onResponse);
}

function cancelMembershipRequest(community, membership, user, onResponse) {
  collaborationModule.member.cancelMembershipRequest(OBJECT_TYPE, community, membership, user, onResponse);
}

function cleanMembershipRequest(community, user, callback) {
  collaborationModule.member.cleanMembershipRequest(community, user, callback);
}

function declineMembershipInvitation(community, membership, user, onResponse) {
  collaborationModule.member.declineMembershipInvitation(OBJECT_TYPE, community, membership, user, onResponse);
}

function getManagers(community, query = {}, callback) {
  _getManagerIds(community, (err, managerIds) => {
    if (err) return callback(err);

    if (managerIds.length === 0) return callback(null, []);

    const offset = query.offset || DEFAULT_OFFSET;
    const limit = query.limit || DEFAULT_LIMIT;

    managerIds = managerIds.slice(offset, offset + limit);

    User.find({ _id: { $in: managerIds } }, callback);
  });
}

function getMembers(community, query = {}, callback) {
  const id = community._id || community;

  Community.findById(id, (err, community) => {
    if (err) { return callback(err); }

    const members = community.members.slice().splice(query.offset || DEFAULT_OFFSET, query.limit || DEFAULT_LIMIT);
    const memberIds = members.map(member => member.member.id);

    User.find({_id: {$in: memberIds}}, (err, users) => {
      if (err) {
        return callback(err);
      }

      const hash = {};

      users.forEach(u => { hash[u._id] = u; });
      members.forEach(m => {
        m.member = hash[m.member.id];
      });

      callback(null, members);
    });
  });
}

function getMembershipRequest(community, user) {
  return collaborationModule.member.getMembershipRequest(community, user);
}

function getMembershipRequests(community, query, callback) {
  return collaborationModule.member.getMembershipRequests(OBJECT_TYPE, community._id || community, query, callback);
}

/**
 * Check a user is a manager of a community
 * @param {Object}   community
 * @param {Object}   user
 * @param {Function} callback
 */
function isManager(community, user, callback) {
  _getManagerIds(community, (err, managerIds) => {
    if (err) return callback(err);

    return callback(null, managerIds.indexOf(String(user._id)) !== -1);
  });
}

function isMember(community, tuple, callback) {
  collaborationModule.member.isMember(community, tuple, callback);
}

function join(community, userAuthor, userTarget, actor, callback) {
  collaborationModule.member.join(OBJECT_TYPE, community, userAuthor, userTarget, actor, callback);
}

function leave(community, userAuthor, userTarget, callback) {
  collaborationModule.member.leave(OBJECT_TYPE, community, userAuthor, userTarget, callback);
}

function refuseMembershipRequest(community, membership, manager, onResponse) {
  collaborationModule.member.refuseMembershipRequest(OBJECT_TYPE, community, membership, manager, onResponse);
}

/**
 * Get manager ids for a community
 * Community manager can be either community creator or domain administrator where the community belongs to
 * @param {Object} community
 * @param {Function} callback
 */
function _getManagerIds(community, callback) {
  const id = community._id || community;
  const query = Community.findById(id);

  query.populate('domain_ids');
  query.exec((err, community) => {
    if (err) return callback(err);

    if (!community) return callback(null, []);

    let managers = [String(community.creator)];

    community.domain_ids.forEach(domain => {
      const domainAdmistratorIds = getDomainAdministrators(domain).map(administrator => String(administrator.user_id));

      managers = managers.concat(domainAdmistratorIds);
    });

    return callback(null, [...new Set(managers)]);
  });
}

function isIndirectMember(collaboration, tuple, callback) {
  collaborationModule.member.isIndirectMember(collaboration, tuple, callback);
}
