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
  var Invitation = mongoose.model('Invitation');
  var userModule = require('../..').user;

  var formValues = data.body.data;
  var userJson = {
    firstname: formValues.firstname,
    lastname: formValues.lastname,
    password: formValues.password,
    emails: [invitation.data.email]
  };

  var finalized = function(callback) {
    Invitation.isFinalized(invitation.uuid, function(err, finalized) {
      if (err) {
        return callback(new Error('Can not check invitation status'));
      }

      if (finalized) {
        return callback(new Error('Invitation is already finalized'));
      }
      callback();
    });
  };

  var testDomainCompany = function(callback) {
    Domain.testDomainCompany(formValues.company, formValues.domain, function(err, domain) {
      if (err) {
        return callback(new Error('Unable to lookup domain/company: ' + formValues.domain + '/' + formValues.company + err));
      }
      if (!domain) {
        return callback(new Error('Domain/company: ' + formValues.domain + '/' + formValues.company + ' do not exist.' + err));
      }
      callback(null, domain);
    });
  };

  var checkUser = function(domain, callback) {
    userModule.findByEmail(userJson.emails, function(err, user) {
      if (err) {
        return callback(new Error('Unable to lookup user ' + userJson.emails + ': ' + err));
      } else if (user && user.emails) {
        return callback(new Error('User already exists'));
      }
    });
    callback(null, domain);
  };

  var createUser = function(domain, callback) {
    userModule.provisionUser(userJson, function(err, user) {
      if (err) {
        return callback(new Error('Cannot create user resources ' + err.message));
      }
      if (user) {
        return callback(null, domain, user);
      } else {
        return callback(new Error('Can not create user'));
      }
    });
  };

  var addUserToDomain = function(domain, user, callback) {
    user.joinDomain(domain, function(err, update) {
      if (err) {
        return callback(new Error('User cannot join domain' + err.message));
      }
      else {
        callback(null, domain, user);
      }
    });
  };

  var finalizeInvitation = function(domain, user, callback) {
    Invitation.loadFromUUID(invitation.uuid, function(err, loaded) {
      if (err) {
        logger.warn('Invitation has not been set as finalized %s', invitation.uuid);
      }
      loaded.finalize(function(err, updated) {
        if (err) {
          logger.warn('Invitation has not been set as finalized %s', invitation.uuid);
        }
        callback(null, domain, user);
      });
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

  async.waterfall([finalized, testDomainCompany, checkUser, createUser, addUserToDomain, finalizeInvitation, result], function(err, result) {
    if (err) {
      logger.error('Error while finalizing invitation', err);
      return done(err);
    } else if (result) {
      return done(null, {status: 201, result: result});
    }
  });

};
