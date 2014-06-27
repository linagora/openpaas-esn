'use strict';

var mongoose = require('mongoose');
var Invitation = mongoose.model('Invitation');
var handler = require('../../core/invitation');

var getInvitationURL = function(req, invitation) {
  return req.openpaas.getBaseURL() + '/invitation/' + invitation.uuid;
};
module.exports.getInvitationURL = getInvitationURL;

/**
 * Call the signup app main page
 */
module.exports.signup = function(req, res) {
  res.render('signup/index');
};

/**
 * Get the invitation from its UUID. Does nothing but return the invitation as JSON
 */
module.exports.get = function(req, res) {
  if (req.invitation) {
    return res.json(200, req.invitation);
  }
  return res.json(404);
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
    handler.isStillValid(invitation, function(err, stillValid) {
      if (err) {
        return res.json(500, {error: 500, message: 'Internal Server Error', details: err});
      }
      if (!stillValid) {
        return res.json(404, {error: 404, message: 'Not found', details: 'Invitation expired'});
      }
      req.invitation = invitation;
      return next();
    });
  });
};

/**
 * Dispatch the invitation to the invitation handler.
 */
module.exports.confirm = function(req, res) {
  if (!req.invitation) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Invitation is missing'});
  }

  return handler.process(req.invitation, {}, function(err, result) {
    if (err) {
      return res.json(500, {error: 500, message: 'Internal error', details: 'Handler is unable to process the invitation ' + err.message});
    }

    if (result) {
      if (result.redirect) {
        return res.redirect(result.redirect);
      }

      if (result.status && result.status >= 200 && result.status < 300) {
        return res.json(result.status, result.result);
      }

    } else {
      return res.json(200);
    }
  });
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

    if (!result) {
      return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Data is invalid'}});
    }

    var invitation = new Invitation(payload);
    invitation.save(function(err, saved) {
      if (err) {
        return res.json(400, { error: { status: 400, message: 'Bad request', details: err.message}});
      }

      saved.data.url = getInvitationURL(req, saved);

      handler.init(saved, function(err, result) {
        if (err) {
          return res.json(500, { error: { status: 500, message: 'Server error', details: err.message}});
        }
        return res.json(201, result);
      });
    });
  });
};

/**
 * Finalize the process.
 */
module.exports.finalize = function(req, res) {

  if (!req.invitation) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Invitation is missing'});
  }

  var data = {
    body: req.body,
    params: req.params
  };

  handler.finalize(req.invitation, data, function(err, result) {
    if (err) {
      return res.json(500, {error: 500, message: 'Internal error', details: 'Handler is unable to finalize the invitation ' + err.message});
    }

    if (result) {
      if (result.redirect) {
        return res.redirect(result.redirect);
      }

      if (result.status && result.status >= 200 && result.status < 300) {
        return res.json(result.status, result.result);
      }

      return res.json(201, result);

    } else {
      return res.json(201);
    }
  });
};
