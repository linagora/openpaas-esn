'use strict';

/**
 * Return an array of users who are not in the collaboration AND
 *  who have no pending membership request/invitation.
 *
 * @param {User[]} users array of user
 * @param {Collaboration} collaboration the collaboration
 * @param {function} callback fn like callback(err, users) (users is an array of users)
 */
function filterByNotInCollaborationAndNoMembershipRequest(users, collaboration, callback) {
  if (!users) {
    return callback(new Error('Users is mandatory'));
  }

  if (!collaboration) {
    return callback(new Error('Community is mandatory'));
  }

  var results = [];
  var memberHash = {};

  if (collaboration.members) {
    collaboration.members.forEach(function(m) {
      memberHash[m.member.id] = true;
    });
  }

  if (collaboration.membershipRequests) {
    collaboration.membershipRequests.forEach(function(membershipRequest) {
      memberHash[membershipRequest.user] = true;
    });
  }

  users.forEach(function(user) {
    if (!memberHash[user._id]) {
      results.push(user);
    }
  });

  return callback(null, results);
}
module.exports.filterByNotInCollaborationAndNoMembershipRequest = filterByNotInCollaborationAndNoMembershipRequest;

