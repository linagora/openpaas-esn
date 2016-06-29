'use strict';

var followModule = require('../../core/user/follow');
var userModule = require('../../core/user');
var logger = require('../../core/logger');

function loadFollowing(req, res, next) {
  userModule.get(req.params.tid, function(err, following) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server error', details: 'Error while loading following'}});
    }

    if (!following) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Can not find following'}});
    }

    req.following = following;
    next();
  });
}
module.exports.loadFollowing = loadFollowing;

function canUnfollow(req, res, next) {
  var following = req.following;

  if (req.user._id.equals(following._id)) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You can not unfollow yourself'}});
  }

  followModule.follows(req.user, following).then(function(result) {
    if (!result) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You can not unfollow this unfollowed user'}});
    }

    followModule.canUnfollow(req.user, following).then(function(result) {
      if (!result) {
        return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You do not have permission to unfollow this user'}});
      }
      next();
    }, function(err) {
      logger.error('Error while checking if user can unfollow other user', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while checking if user can unfollow other user'}});
    });

  }, function(err) {
    logger.error('Error while checking if user is already followed by user', err);
    return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not check if user already follows other user'}});
  });
}
module.exports.canUnfollow = canUnfollow;

function canFollow(req, res, next) {
  var following = req.following;

  if (req.user._id.equals(following._id)) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You can not follow yourself'}});
  }

  followModule.follows(req.user, following).then(function(result) {
    if (result) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You already follow this user'}});
    }

    followModule.canFollow(req.user, following).then(function(result) {
      if (!result) {
        return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You do not have permission to follow this user'}});
      }
      next();
    }, function(err) {
      logger.error('Error while checking if user is can follow other user', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while checking if user is can follow other user'}});
    });

  }, function(err) {
    logger.error('Error while checking if user is already followed by user', err);
    return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not check if user already follows other user'}});
  });
}
module.exports.canFollow = canFollow;
