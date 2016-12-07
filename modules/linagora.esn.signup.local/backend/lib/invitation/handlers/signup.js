'use strict';

var emailAddresses = require('email-addresses');
var async = require('async');
var invitationValidityDays = 7;

module.exports = dependencies => {
  const logger = dependencies('logger'),
        signupEmail = dependencies('email').system.signupConfirmation,
        exports = {};

  exports.isStillValid = function(invitation, done) {
    var limitDate = new Date(invitation.timestamps.created.getTime());

    limitDate.setDate(limitDate.getDate() + invitationValidityDays);

    return done(null, limitDate.getTime() >= Date.now());
  };

  /**
   * Validate the input data: required properties are firstname, lastname, email and password.
   */
  exports.validate = function(invitation, done) {
    const data = invitation.data;

    if (!data ||
        !data.firstname || !data.lastname || !data.email || !data.password || !data.confirmPassword ||
        data.password !== data.confirmPassword ||
        emailAddresses.parseOneAddress(data.email) === null) {
      return done(null, false);
    }

    return done(null, true);
  };

  /**
   * Send email to the user. At this step, the data is valid and we should have an invitation UUID.
   */
  exports.init = function(invitation, done) {
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
  exports.process = function(invitation, data, done) {
    if (invitation) {
      return done(null, {redirect: '/#/signup/' + invitation.uuid});
    }

    return done(new Error('Can not find any valid invitation'));
  };

  /**
   * Create the user resources
   */
  exports.finalize = function(invitation, data, done) {
    if (!invitation) {
      return done(new Error('Invalid invitation request'));
    }

    if (!data) {
      return done(new Error('Request data is required'));
    }

    var formValues = data.body.data,
        helper = dependencies('invitation').initHelper(invitation, formValues);

    async.waterfall(
      [
        helper.isInvitationFinalized,
        helper.checkUser,
        helper.createUser,
        helper.loadSingleDomain,
        helper.addUserToDomain,
        helper.finalizeInvitation,
        helper.result
      ], function(err, result) {
        if (err) {
          logger.error('Error while finalizing invitation', err);

          return done(err);
        } else if (result) {
          return done(null, { status: 201, result: result });
        }
      });
  };

  return exports;
};
