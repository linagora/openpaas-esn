const logger = require('../../core/logger');
const collaborationModule = require('../../core/collaboration');
const composableMW = require('composable-middleware');

module.exports = {
  load,
  canLeave,
  canRead,
  checkUserParamIsNotMember,
  checkUserIdParameterIsCurrentUser,
  flagCollaborationManager,
  ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser,
  requiresCollaborationMember
};

function load(req, res, next) {
  if (!req.params.id) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'id is required'}});
  }

  if (!req.params.objectType) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'objectType is required'}});
  }

  collaborationModule.queryOne(req.params.objectType, {_id: req.params.id}, function(err, collaboration) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server error', details: 'Error while loading collaboration: ' + err.message}});
    }

    if (!collaboration || collaboration.length === 0) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Collaboration not found'}});
    }
    req.collaboration = collaboration;

    next();
  });
}

function canLeave(req, res, next) {
  if (!req.collaboration) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'Missing collaboration'});
  }

  if (!req.user) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'Missing user'});
  }

  if (!req.params || !req.params.user_id) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'User_id is missing'});
  }

  if (!req.isCollaborationManager && !req.user._id.equals(req.params.user_id)) {
    return res.status(403).json({error: 403, message: 'Forbidden', details: 'No permissions to remove another user'});
  }

  if (req.isCollaborationManager) {
    return targetUserCanBeRemoved(req, res, next);
  }

  return composableMW([
    requiresCollaborationMember,
    targetUserCanBeRemoved
  ])(req, res, next);
}

function targetUserCanBeRemoved(req, res, next) {
  collaborationModule.permission.canLeave(req.collaboration, { objectType: 'user', id: req.params.user_id }, (err, canLeave) => {
    if (err) {
      logger.error('Error while checking user can leave collaboration', err);

      return res.status(500).json({ error: 500, message: 'Server Error', details: 'Can not check user can leave or not' });
    }

    if (!canLeave) {
      return res.status(403).json({ error: 403, message: 'Forbidden', details: 'User can not leave the collaboration' });
    }

    next();
  });
}

function requiresCollaborationMember(req, res, next) {
  collaborationModule.member.isMember(req.collaboration, {objectType: 'user', id: req.user._id}, function(err, isMember) {
    if (err) {
      return res.status(500).json({error: 500, message: 'Server error', details: 'Can not define the collaboration membership: ' + err.message});
    }

    if (!isMember) {
      return res.status(403).json({error: 403, message: 'Forbidden', details: 'User is not collaboration member'});
    }

    return next();
  });
}

function canRead(req, res, next) {
  if (req.isCollaborationManager) {
    return next();
  }

  if (req.collaboration.type === collaborationModule.CONSTANTS.COLLABORATION_TYPES.OPEN ||
    req.collaboration.type === collaborationModule.CONSTANTS.COLLABORATION_TYPES.RESTRICTED) {
    return next();
  }

  return requiresCollaborationMember(req, res, next);
}

function checkUserParamIsNotMember(req, res, next) {
  if (!req.collaboration) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.params.user_id) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user id'});
  }

  collaborationModule.member.isMember(req.collaboration, req.params.user_id, function(err, isMember) {
    if (err) {
      return res.status(400).json({error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message});
    }

    if (isMember) {
      return res.status(400).json({error: 400, message: 'Bad request', details: 'User is already member of the community.'});
    }

    return next();
  });
}

function flagCollaborationManager(req, res, next) {
  if (!req.collaboration) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing collaboration'});
  }

  if (!req.user) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user'});
  }

  const lib = collaborationModule.getLib(req.params.objectType);

  if (lib && lib.member && lib.member.isManager) {
    return lib.member.isManager(req.collaboration, req.user, callback);
  }

  collaborationModule.member.isManager(req.params.objectType, req.collaboration, req.user, callback);

  function callback(err, isManager) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Error when checking if the user is a manager', details: err.message}});
    }

    req.isCollaborationManager = isManager;
    next();
  }
}

function checkUserIdParameterIsCurrentUser(req, res, next) {
  if (!req.user) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Missing user'}});
  }

  if (!req.params.user_id) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Missing user id'}});
  }

  if (!req.user._id.equals(req.params.user_id)) {
    return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'You do not have the permission to invite another user'}});
  }

  return next();
}

function ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser(req, res, next) {
  if (req.isCollaborationManager) {
    return next();
  }

  checkUserIdParameterIsCurrentUser(req, res, next);
}
