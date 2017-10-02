'use strict';

const q = require('q');
const esnConfig = require('../../core/esn-config');
const followModule = require('../../core/user/follow');
const denormalizeUser = require('../../core/user/denormalize');
const rights = require('../../core/esn-config/rights');
const platformAdmin = require('../../core/platformadmin');

const isUserWide = true;

module.exports = {
  denormalize
};

function denormalize(user, options = {}) {
  return sanitize(user, options)
    .then(sanitized => setIsFollowing(sanitized, options.user))
    .then(follow)
    .then(sanitized => setIsPlatformAdmin(user, sanitized))
    .then(sanitized => setState(user, sanitized))
    .then(sanitized => loadConfigurations(user, sanitized));
}

function setIsPlatformAdmin(user, sanitized) {
  return platformAdmin.isPlatformAdmin(user.id)
    .then(isPlatformAdmin => {
      sanitized.isPlatformAdmin = isPlatformAdmin;

      return sanitized;
    }, () => sanitized);
}

function sanitize(user, options) {
  return q(denormalizeUser.denormalize(user, options.includePrivateData));
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
