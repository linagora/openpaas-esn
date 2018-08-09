'use strict';

const userModule = require('../../core').user;
const composableMw = require('composable-middleware');
const platformadminsMW = require('../middleware/platformadmins');

module.exports = {
  checkProfilesQueryPermission,
  loadTargetUser,
  requireProfilesQueryParams,
  validateUserStates
};

function onFind(req, res, next, err, user) {
  if (err) {
    return res.status(500).json({error: {code: 500, message: 'Server error', details: err.message}});
  }

  if (!user) {
    return res.status(404).json({error: {code: 404, message: 'Not found', details: 'User not found'}});
  }

  req.targetUser = user;
  next();
}

function loadTargetUser(req, res, next) {
  if (req.params.uuid) {
    return userModule.get(req.params.uuid, onFind.bind(null, req, res, next));
  } else if (req.query.email || req.body.email) {
    return userModule.findByEmail(req.query.email || req.body.email, onFind.bind(null, req, res, next));
  } else {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'uuid or email missing'}});
  }
}

function checkProfilesQueryPermission(req, res, next) {
  const middlewares = [];

  if (!req.query.email && req.query.search) {
    middlewares.push(platformadminsMW.requirePlatformAdmin);
  }

  return composableMw(...middlewares)(req, res, next);
}

function requireProfilesQueryParams(req, res, next) {
  let details;

  if (!req.query.email && !req.query.search) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details
      }
    });
  }

  next();
}

function validateUserStates(req, res, next) {
  const states = req.body;
  const validStates = !states.some(state => !(userModule.states.validateUserAction(state.name) && userModule.states.validateActionState(state.value)));

  if (!validStates) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'States is not valid'
      }
    });
  }

  next();
}

