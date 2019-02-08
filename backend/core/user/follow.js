'use strict';

const Q = require('q');
const pubsub = require('../pubsub');
const resourceLink = require('../resource-link');
const logger = require('../logger');
const CONSTANTS = require('./constants');

function userAsTuple(user) {
  return {objectType: CONSTANTS.OBJECT_TYPE, id: String(user._id)};
}

function follow(user, following) {
  return resourceLink.create({source: {objectType: 'user', id: String(user._id)}, target: {objectType: 'user', id: String(following._id)}, type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.follow = follow;

function unfollow(user, following) {
  return resourceLink.remove({source: {objectType: 'user', id: String(user._id)}, target: {objectType: 'user', id: String(following._id)}, type: CONSTANTS.FOLLOW_LINK_TYPE});
}
module.exports.unfollow = unfollow;

function listen() {
  pubsub.local.topic('resource:link:follow:user').subscribe(function(data) {
    logger.info('Someone followed someone else...', data);
  });
}
module.exports.listen = listen;

function getUserStats(user) {
  return Q.all([getNbOfFollowers(user), getNbOfFollowings(user)]).spread(function(followers, followings) {
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
  // SOC-25: Cyclic dependency. userModule.get is undefined if required above
  const userModule = require('./index');

  return Q.all([resourceLink.list(options), resourceLink.count(options)]).spread(function(links, count) {
    var promises = links.map(function(link) {
      return Q.denodeify(userModule.get)(link[type].id).then(function(user) {
        return {
          link: link,
          user: user
        };
      });
    });

    return Q.all(promises).then(function(users) {
      return {
        list: users,
        total_count: count
      };
    });
  });
}

function countFollowers(user) {
  const options = {
    target: userAsTuple(user),
    type: CONSTANTS.FOLLOW_LINK_TYPE
  };

  return resourceLink.count(options);
}
module.exports.countFollowers = countFollowers;

function getFollowers(user, options = {}) {
  options.target = userAsTuple(user);
  options.type = CONSTANTS.FOLLOW_LINK_TYPE;

  return listUsers(options, 'source');
}
module.exports.getFollowers = getFollowers;

function getFollowings(user, options = {}) {
  options.source = userAsTuple(user);
  options.type = CONSTANTS.FOLLOW_LINK_TYPE;

  return listUsers(options, 'target');
}
module.exports.getFollowings = getFollowings;

function countFollowings(user) {
  const options = {
    source: userAsTuple(user),
    type: CONSTANTS.FOLLOW_LINK_TYPE
  };

  return resourceLink.count(options);
}
module.exports.countFollowings = countFollowings;

function canFollow() {
  return Q(true);
}
module.exports.canFollow = canFollow;

function canUnfollow() {
  return Q(true);
}
module.exports.canUnfollow = canUnfollow;
