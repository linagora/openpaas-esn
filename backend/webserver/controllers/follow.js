'use strict';

var logger = require('../../core/logger');
var followModule = require('../../core/user/follow');
var denormalizeUser = require('../denormalize/user').denormalize;
var q = require('q');

var DEFAULT_LIMIT = 10;
var DEFAULT_OFFSET = 0;

function denormalize(data) {
  const denormalizeOptions = {
    includeIsFollowing: true,
    includeFollow: true
  };
  var promises = data.map(function(item) {
    return denormalizeUser(item.user, denormalizeOptions).then(function(result) {
      item.user = result;
      return item;
    }, function(err) {
      logger.error('Error on denormalize', err);
      delete item.user;
      return item;
    });
  });
  return q.all(promises);
}

function follow(req, res) {
  followModule.follow(req.user, req.following).then(function(result) {
    res.status(201).json(result);
  }, function(err) {
    logger.error('Error while following user', err);
    res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
  });
}
module.exports.follow = follow;

function unfollow(req, res) {
  followModule.unfollow(req.user, req.following).then(function() {
    res.status(204).end();
  }, function(err) {
    logger.error('Error while unfollowing user', err);
    res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
  });
}
module.exports.unfollow = unfollow;

function getPaginationOptions(req) {
  return { offset: +req.query.offset || DEFAULT_OFFSET, limit: +req.query.limit || DEFAULT_LIMIT };
}

function getFollowers(req, res) {
  const pagination = getPaginationOptions(req);

  followModule.getFollowers({_id: req.params.id}, pagination)
    .then(result => {
      res.header('X-ESN-Items-Count', result.total_count);

      return result.list || [];
    })
    .then(denormalize)
    .then(denormalized => res.status(200).json(denormalized || []))
    .catch(err => {
      logger.error('Error while getting followers', err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
    });
}
module.exports.getFollowers = getFollowers;

function getFollowings(req, res) {
  const pagination = getPaginationOptions(req);

  followModule.getFollowings({_id: req.params.id}, pagination)
    .then(result => {
      res.header('X-ESN-Items-Count', result.total_count);

      return result.list || [];
    })
    .then(denormalize)
    .then(denormalized => res.status(200).json(denormalized || []))
    .catch(err => {
      logger.error('Error while getting followings', err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
    });
}
module.exports.getFollowings = getFollowings;

function isFollowing(req, res) {
  followModule.follows({_id: req.params.id}, {_id: req.params.tid}).then(function(result) {
    if (result) {
      return res.status(204).end();
    }
    res.status(404).end();
  }, function(err) {
    logger.error('Error while getting following status', err);
    res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
  });
}
module.exports.isFollowing = isFollowing;
