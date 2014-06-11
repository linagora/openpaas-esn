'use strict';

var conference = require('../../core/conference');

module.exports.canJoin = function(req, res, next) {

  if (!req.user) {
    return res.json(400, {
      error: {
        code: 400,
        message: 'Bad request',
        details: 'User is required'
      }
    });
  }

  if (!req.conference) {
    return res.json(400, {
      error: {
        code: 400,
        message: 'Bad request',
        details: 'Conference is required'
      }
    });
  }

  conference.userCanJoinConference(req.conference, req.user, function(err, status) {
    if (err) {
      return res.json(500, {
        error: {
          code: 500,
          message: 'Server error',
          details: err.message
        }
      });
    }

    if (!status) {
      return res.json(403, {
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'User does not have access to conference'
        }
      });
    }
    return next();
  });
};

module.exports.isAdmin = function(req, res, next) {
  if (!req.user) {
    return res.json(400, {
      error: {
        code: 400,
        message: 'Bad request',
        details: 'User is required'
      }
    });
  }

  if (!req.conference) {
    return res.json(400, {
      error: {
        code: 400,
        message: 'Bad request',
        details: 'Conference is required'
      }
    });
  }

  conference.userIsConferenceCreator(req.conference, req.user, function(err, status) {
    if (err) {
      return res.json(500, {
        error: {
          code: 500,
          message: 'Server error',
          details: err.message
        }
      });
    }

    if (!status) {
      return res.json(403, {
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'User is not conference admin'
        }
      });
    }
    return next();
  });
};

