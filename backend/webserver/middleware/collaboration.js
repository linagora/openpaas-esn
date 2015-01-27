'use strict';

var collaborationModule = require('../../core/collaboration');

function load(req, res, next) {
  if (!req.params.id) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'id is required'}});
  }

  if (!req.params.objectType) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'objectType is required'}});
  }

  collaborationModule.queryOne(req.params.objectType, {_id: req.params.id}, function(err, collaboration) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server error', details: 'Error while loading collaboration: ' + err.message}});
    }

    if (!collaboration || collaboration.length === 0) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'Collaboration not found'}});
    }
    req.collaboration = collaboration;

    next();
  });
}
module.exports.load = load;

function canLeave(req, res, next) {
  if (!req.collaboration) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing collaboration'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User_id is missing'}});
  }

  if (req.user._id.equals(req.collaboration.creator)) {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'Creator can not leave collaboration'});
  }

  return next();
}
module.exports.canLeave = canLeave;

  function requiresCollaborationMember(req, res, next) {
  collaborationModule.isMember(req.collaboration, {objectType: 'user', id: req.user._id}, function(err, isMember) {
    if (err) {
      return res.json(500, {error: 500, message: 'Server error', details: 'Can not define the collaboration membership: ' + err.message});
    }

    if (!isMember) {
      return res.json(403, {error: 403, message: 'Forbidden', details: 'User is not collaboration member'});
    }
    return next();
  });
}
module.exports.requiresCollaborationMember = requiresCollaborationMember;

function canRead(req, res, next) {
  if (req.collaboration.type === 'open' || req.collaboration.type === 'restricted') {
    return next();
  }
  return requiresCollaborationMember(req, res, next);
}
module.exports.canRead = canRead;

module.exports.checkUserParamIsNotMember = function(req, res, next) {
  if (!req.collaboration) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.param('user_id')) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user id'});
  }

  collaborationModule.isMember(req.collaboration, req.param('user_id'), function(err, isMember) {
    if (err) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message});
    }

    if (isMember) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'User is already member of the community.'});
    }
    return next();
  });
};

module.exports.flagCollaborationManager = function(req, res, next) {
  if (!req.collaboration) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing collaboration'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  collaborationModule.isManager(req.params.objectType, req.collaboration, req.user, function(err, manager) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Error when checking if the user is a manager', details: err.message}});
    }
    req.isCollaborationManager = manager;
    next();
  });
};

function checkUserIdParameterIsCurrentUser(req, res, next) {
  if (!req.user) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Missing user'}});
  }

  if (!req.param('user_id')) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Missing user id'}});
  }

  if (!req.user._id.equals(req.param('user_id'))) {
    return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'You do not have the permission to invite another user'}});
  }

  return next();
}
module.exports.checkUserIdParameterIsCurrentUser = checkUserIdParameterIsCurrentUser;

function ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser(req, res, next) {
  if (req.isCollaborationManager) {
    return next();
  }

  checkUserIdParameterIsCurrentUser(req, res, next);
}
module.exports.ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser = ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser;
