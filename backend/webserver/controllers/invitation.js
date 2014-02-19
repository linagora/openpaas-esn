'use strict';

var mongoose = require('mongoose');
var Invitation = mongoose.model('Invitation');
var handler = require('../../core/invitation');

/**
 * Get the invitation from its UUID. Does nothing but return the invitation as JSON
 */
module.exports.get = function(req, res) {
  Invitation.loadFromUUID(req.params.uuid, function(err, invitation) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server Error', details: err.message}});
    }
    if (!invitation) {
      return res.json(404, { error: { status: 404, message: 'Not found', details: 'No such invitation ' + req.uuid}});
    }
    return res.json(200, invitation);
  });
};

/**
 * Load the invitation
 */
module.exports.load = function(req, res, next) {
  Invitation.loadFromUUID(req.params.uuid, function(err, invitation) {
    if (err) {
      return next(err);
    }
    if (!invitation) {
      return res.send(404);
    }
    req.invitation = invitation;
    return next();
  });
};

/**
 * Dispatch the invitation to the invitation handler.
 */
module.exports.confirm = function(req, res, next) {
  return handler.process(req, res, next);
};

/**
 * Save the req.body as invitation after validation.
 */
module.exports.create = function(req, res) {
  if (!req.body) {
    return res.send(400, { error: { status: 400, message: 'Bad request', details: 'Missing JSON payload'}});
  }

  var payload = req.body;
  handler.validate(payload, function(err, result) {
    if (err) {
      return res.json(400, { error: { status: 400, message: 'Bad request', details: err.message}});
    }
  });

  var invitation = new Invitation(payload);
  invitation.save(function(err, saved) {
    if (err) {
      return res.json(400, { error: { status: 400, message: 'Bad request', details: err.message}});
    }
    handler.init(saved, function(err, result) {
      if (err) {
        return res.json(500, { error: { status: 500, message: 'Server error', details: err.message}});
      }
      return res.json(201, result);
    });
  });
};

/**
 * Finalize the process.
 */
module.exports.finalize = function(req, res, next) {
  return handler.finalize(req, res, next);
};
