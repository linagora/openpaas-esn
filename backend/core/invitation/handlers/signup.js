'use strict';

var emailAddresses = require('email-addresses');
var signupEmail = require('../../email/system/signupConfirmation');
var logger = require('../..').logger;

/**
 * Validate the input data: required properties are firstname, lastname and email.
 */
module.exports.validate = function(invitation, done) {
  if (!invitation.data) {
    return done(null, false);
  }
  if (!invitation.data.firstname || !invitation.data.lastname || !invitation.data.email) {
    return done(null, false);
  }
  if (emailAddresses.parseOneAddress(invitation.data.email) === null) {
    return done(null, false);
  }
  return done(null, true);
};

/**
 * Send email to the user. At this step, the data is valid and we should have an invitation UUID.
 */
module.exports.init = function(invitation, done) {
  if (!invitation.uuid) {
    return done(new Error('Invitation UUID is required'));
  }
  if (!invitation.data.url) {
    return done(new Error('Invitation URL is required'));
  }
  signupEmail(invitation, function(err, result) {
    if (err) {
      logger.warn('Signup invitation have not been sent %s', err.message);
    }
    logger.debug('Signup invitation has been sent ' + invitation);
    done(err, result);
  });
};

/**
 * Redirect the user to the right page
 */
module.exports.process = function(req, res, next) {
  return next(new Error('Process is not implemented'));
};

/**
 * Create the user resources
 */
module.exports.finalize = function(req, res, next) {
  return next(new Error('Finalize is not implemented'));
};
