'use strict';

var emailAddresses = require('email-addresses');
var logger = require('../..').logger;

/**
 * Validate the input data ie this is a valid email.
 */
module.exports.validate = function(invitation, done) {
  if (!invitation.data) {
    return done(null, false);
  }

  if (!invitation.data.firstname || !invitation.data.lastname || !invitation.data.domain || !invitation.data.email) {
    return done(null, false);
  }

  if (emailAddresses.parseOneAddress(invitation.data.email) === null) {
    return done(null, false);
  }
  return done(null, true);
};

/**
 * Send email to the invited user.
 * At this step, the data is valid and we should have an unique invitation UUID.
 */
module.exports.init = function(invitation, done) {
  if (!invitation.uuid) {
    return done(new Error('Invitation UUID is required'));
  }
  if (!invitation.data.url) {
    return done(new Error('Invitation URL is required'));
  }

  var addmemberEmail = function(invitation, cb) {
    return cb(new Error('The add member email is not implemented'));
  };

  addmemberEmail(invitation, function(err, result) {
    if (err) {
      logger.warn('Add member invitation have not been sent %s', err.message);
    } else {
      logger.debug('Add member invitation has been sent ' + invitation);
    }
    done(err, result);
  });
};

/**
 * Redirect the user to the right invitation page
 */
module.exports.process = function(req, res, next) {
  if (req.invitation) {
    return res.redirect('/#/addmember/' + req.invitation.uuid);
  }
  return next(new Error('Can not find any valid invitation'));
};

/**
 * Create the user resources.
 */
module.exports.finalize = function(req, res, next) {

  if (!req.invitation) {
    return next(new Error('Invalid invitation request'));
  }

  if (!req.body.data) {
    return next(new Error('Request data is required'));
  }

  return res.json(500, {error: 500, message: 'Not implemented', details: 'The add member finalize is not implemented'});
};
