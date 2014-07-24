'use strict';

var communityModule = require('../../core/community');

module.exports.canJoin = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (req.community.type !== 'open') {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'Can not join community'});
  }

  return next();
};

module.exports.canLeave = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (req.user._id.equals(req.community.creator)) {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'Creator can not leave community'});
  }

  return next();
};

module.exports.isMember = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  communityModule.isMember(req.community, req.user, function(err, isMember) {
    if (err) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message});
    }

    if (!isMember) {
      return res.json(403, {error: 403, message: 'Forbidden', details: 'User is not community member'});
    }
    return next();
  });
};

module.exports.isCreator = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.user._id.equals(req.community.creator)) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Not the community creator'});
  }

  return next();
};
