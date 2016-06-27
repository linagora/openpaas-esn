'use strict';

var q = require('q');
var pubsub = require('../pubsub');
var resourceLink = require('../resource-link');
var logger = require('../logger');
var CONSTANTS = require('./constants');
var userModule = require('./index');

function userAsTuple(user) {
  return {objectType: CONSTANTS.OBJECT_TYPE, id: String(user._id)};
}

function follow(user, following) {
  return resourceLink.create({source: {objectType: 'user', id: String(user._id)}, target: {objectType: 'user', id: String(following._id)}, type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.follow = follow;

function unfollow(user, following) {
  return q.reject(new Error('Not implemented'));
}
module.exports.unfollow = unfollow;

function listen() {
  pubsub.local.topic('resource:link:follow:user').subscribe(function(data) {
    logger.info('Someone followed someone else...', data);
  });
}
module.exports.listen = listen;

function getUserStats(user) {
  return q.all([getNbOfFollowers(user), getNbOfFollowings(user)]).spread(function(followers, followings) {
    return {
      followers: followers,
      followings: followings
    };
  });
}
module.exports.getUserStats = getUserStats;

function getNbOfFollowers(user) {
  return resourceLink.count({target: userAsTuple(user), type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.getNbOfFollowers = getNbOfFollowers;

function getNbOfFollowings(user) {
  return resourceLink.count({source: userAsTuple(user), type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.getNbOfFollowings = getNbOfFollowings;

function isFollowedBy(userA, userB) {
  return resourceLink.exists({source: userAsTuple(userB), target: userAsTuple(userA), type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.isFollowedBy = isFollowedBy;

function follows(userA, userB) {
  return resourceLink.exists({source: userAsTuple(userA), target: userAsTuple(userB), type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.follows = follows;

function listUsers(options, type) {
  return q.all([resourceLink.list(options), resourceLink.count(options)]).spread(function(links, count) {
    var promises = links.map(function(link) {
      return q.denodeify(userModule.get)(link[type].id).then(function(user) {
        return {
          link: link,
          user: user
        };
      });
    });

    return q.all(promises).then(function(users) {
      return {
        list: users,
        total_count: count
      };
    });
  });
}

function getFollowers(user, options) {
  options = options || {};
  options.target = userAsTuple(user);
  options.type = CONSTANTS.FOLLOW_LINK_TYPE;

  return listUsers(options, 'source');
}
module.exports.getFollowers = getFollowers;

function getFollowings(user, options) {
  options = options || {};
  options.source = userAsTuple(user);
  options.type = CONSTANTS.FOLLOW_LINK_TYPE;

  return listUsers(options, 'target');
}
module.exports.getFollowings = getFollowings;

function canFollow(userA, userB) {
  return q(true);
}
module.exports.canFollow = canFollow;
