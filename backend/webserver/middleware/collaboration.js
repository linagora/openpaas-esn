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
