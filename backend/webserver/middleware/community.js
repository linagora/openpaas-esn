'use strict';

var communityModule = require('../../core/community');

module.exports.canJoin = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User_id is missing'}});
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

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User_id is missing'}});
  }

  if (req.user._id.equals(req.community.creator)) {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'Creator can not leave community'});
  }

  return next();
};

function isMember(req, res, next) {
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
}

module.exports.isMember = isMember;

module.exports.checkUserParamIsNotMember = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.param('user_id')) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user id'});
  }

  communityModule.isMember(req.community, req.param('user_id'), function(err, isMember) {
    if (err) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message});
    }

    if (isMember) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'User is already member of the community.'});
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

module.exports.checkUserIdParameterIsCurrentUser = function(req, res, next) {
  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.param('user_id')) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user id'});
  }

  if (!req.user._id.equals(req.param('user_id'))) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Parameters do not match'});
  }
  return next();
};

module.exports.canRead = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (req.community.type === 'open' || req.community.type === 'restricted') {
    return next();
  }
  return isMember(req, res, next);
};
