'use strict';

var logger = require('../../core/logger');
var followModule = require('../../core/user/follow');

var DEFAULT_LIMIT = 10;
var DEFAULT_OFFSET = 0;

function getPaginationOptions(req) {
  return {offset: req.query.offset || DEFAULT_OFFSET, limit: req.query.limit || DEFAULT_LIMIT};
}

function getFollowers(req, res) {
  followModule.getFollowers({_id: req.params.id}, getPaginationOptions(req)).then(function(result) {
    res.header('X-ESN-Items-Count', result.total_count);
    res.status(200).json(result.list || []);
  }, function(err) {
    logger.error('Error while getting followers', err);
    res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
  });
}
module.exports.getFollowers = getFollowers;

function getFollowings(req, res) {
  followModule.getFollowings({_id: req.params.id}, getPaginationOptions(req)).then(function(result) {
    res.header('X-ESN-Items-Count', result.total_count);
    res.status(200).json(result.list || []);
  }, function(err) {
    logger.error('Error while getting followings', err);
    res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
  });
}
module.exports.getFollowings = getFollowings;

function isFollowing(req, res) {
  followModule.follows({_id: req.params.id}, {_id: req.params.tid}).then(function(result) {
    if (result) {
      return res.status(204).send();
    }
    res.status(404).send();
  }, function(err) {
    logger.error('Error while getting following status', err);
    res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
  });
}
module.exports.isFollowing = isFollowing;
