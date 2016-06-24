'use strict';

var q = require('q');

var followModule = require('../../core/user/follow');
var sanitizeUser = require('../controllers/utils').sanitizeUser;

function sanitize(user, options) {
  return q(sanitizeUser(user, options.doNotKeepPrivateData || true));
}

function follow(user) {
  return followModule.getUserStats(user).then(function(stats) {
    user.followers = stats.followers || 0;
    user.followings = stats.followings || 0;
    return user;
  }, function() {
    user.followers = 0;
    user.followings = 0;
    return user;
  });
}

function setIsFollowing(user, loggedUser) {
  if (!loggedUser) {
    return q(user);
  }

  if (loggedUser._id.equals(user._id)) {
    return q(user);
  }

  return followModule.isFollowedBy(user, loggedUser).then(function(result) {
    user.following = result;
    return user;
  }, function(err) {
    return user;
  });
}

function denormalize(user, options) {
  options = options || {};
  return sanitize(user, options)
    .then(function(sanitized) {
      return setIsFollowing(sanitized, options.user);
    })
    .then(follow);
}
module.exports.denormalize = denormalize;
