'use strict';

var emailAddresses = require('email-addresses'),
    async = require('async'),
    logger = require('../../logger'),
    signupEmail = require('../../email/system/signupConfirmation');

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
    } else {
      logger.debug('Signup invitation has been sent ' + invitation);
    }
    done(err, result);
  });
};

/**
 * Redirect the user to the right invitation page
 */
module.exports.process = function(invitation, data, done) {
  if (invitation) {
    return done(null, {redirect: '/#/signup/' + invitation.uuid});
  }
  return done(new Error('Can not find any valid invitation'));
};

/**
 * Create the user resources
 */
module.exports.finalize = function(invitation, data, done) {

  if (!invitation) {
    return done(new Error('Invalid invitation request'));
  }

  if (!data) {
    return done(new Error('Request data is required'));
  }
  var formValues = data.body.data;
  var helper = require('./invitationHandlerHelper').initHelper(invitation, formValues);

  async.waterfall(
    [
      helper.isInvitationFinalized,
      helper.testDomainCompany,
      helper.checkUser,
      helper.createUser,
      function(user, callback) {
        helper.createDomain(user, formValues, callback);
      },
      helper.addUserToDomain,
      helper.finalizeInvitation,
      helper.result
    ], function(err, result) {
      if (err) {
        logger.error('Error while finalizing invitation', err);
        return done(err);
      } else if (result) {
        return done(null, {status: 201, result: result});
      }
    });
};
