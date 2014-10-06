'use strict';

module.exports.filterMemberShipRequestsByUser = function(community, user) {
  if (!user) {
    return community;
  }

  if (!community || !community.membershipRequests) {
    return community;
  }

  var userId = user._id || user;
  community.membershipRequests = community.membershipRequests.filter(function(request) {
    var requestUserId = request.user._id || request.user;
    return requestUserId.equals(userId);
  });

  return community;
};
