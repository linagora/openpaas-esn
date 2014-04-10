'use strict';

var emailAddresses = require('email-addresses');
var logger = require('../..').logger;
var async = require('async');
var sendMail = require('../../email/system/addMember');
var mongoose = require('mongoose');

/**
 * Validate the input data ie this is a valid email.
 */
module.exports.validate = function(invitation, done) {
  if (!invitation.data) {
    return done(null, false);
  }

  if (!invitation.data.user || !invitation.data.domain || !invitation.data.email) {
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

  sendMail(invitation, function(err, result) {
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
module.exports.process = function(invitation, data, done) {
  if (invitation) {
    return done(null, {redirect: '/#/addmember/' + invitation.uuid});
  }
  return done(new Error('Can not find any valid invitation'));
};


/**
 * Create the user resources.
 */
module.exports.finalize = function(invitation, data, done) {
  if (!invitation) {
    return done(new Error('Invitation is missing'));
  }

  if (!data) {
    return done(new Error('Request data is required'));
  }

  var Domain = mongoose.model('Domain');
  var formValues = data.body.data;
  var domain;

  var helper = require('./invitationHandlerHelper');
  helper.initHelper(invitation, formValues);

  var testDomainExists = function(callback) {
    Domain.testDomainCompany(formValues.company, formValues.domain, function(err, foundDomain) {
      if (err) {
        return callback(new Error('Unable to lookup domain/company: ' + formValues.domain + '/' + formValues.company + err));
      }
      if (!foundDomain) {
        return callback(new Error('Domain/company: ' + formValues.domain + '/' + formValues.company + ' do not exist.' + err));
      }
      domain = foundDomain;
      callback(null);
    });
  };


  var addUserToDomain = function(user, callback) {
    user.joinDomain(domain, function(err, update) {
      if (err) {
        return callback(new Error('User cannot join domain' + err.message));
      }
      else {
        callback(null, domain, user);
      }
    });
  };

  var result = function(domain, user, callback) {
    var result = {
      status: 'created',
      resources: {
        user: user._id,
        domain: domain._id
      }
    };
    callback(null, result);
  };

  async.waterfall([helper.isInvitationFinalized, testDomainExists, helper.checkUser, helper.createUser, addUserToDomain, helper.finalizeInvitation, result], function(err, result) {
    if (err) {
      logger.error('Error while finalizing invitation', err);
      return done(err);
    } else if (result) {
      return done(null, {status: 201, result: result});
    }
  });

};
