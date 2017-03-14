'use strict';

const q = require('q');
const esnConfig = require('../../core/esn-config');
const followModule = require('../../core/user/follow');
const sanitizeUser = require('../controllers/utils').sanitizeUser;
const rights = require('../../core/esn-config/rights');

const isUserWide = true;

function sanitize(user, options) {
  return q(sanitizeUser(user, options.doNotKeepPrivateData || false));
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
  }, function() {
    return user;
  });
}

function setState(user, sanitized) {
  sanitized.disabled = !!user.login.disabled;

  return q(sanitized);
}

function loadConfigurations(user, sanitized) {
  return esnConfig.getConfigsForUser(user, isUserWide).then(configs => {
    configs.modules.map(module => {
      module.configurations = module.configurations.filter(configuration => rights.userCanRead(module.name, configuration.name));
    }).filter(Boolean);

    sanitized.configurations = configs;

    return sanitized;
  });
}

function denormalize(user, options) {
  options = options || {};

  return sanitize(user, options)
    .then(function(sanitized) {
      return setIsFollowing(sanitized, options.user);
    })
    .then(follow)
    .then(setState.bind(null, user))
    .then(loadConfigurations.bind(null, user));
}
module.exports.denormalize = denormalize;
