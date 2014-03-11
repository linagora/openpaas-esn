'use strict';

var emailAddresses = require('email-addresses');
var async = require('async');
var signupEmail = require('../../email/system/signupConfirmation');
var logger = require('../..').logger;
var mongoose = require('mongoose');
var userModule = require('../..').user;

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
module.exports.process = function(req, res, next) {
  if (req.invitation) {
    return res.redirect('/#/signup/' + req.invitation.uuid);
  }
  return next(new Error('Can not find any valid invitation'));
};

/**
 * Create the user resources
 */
module.exports.finalize = function(req, res, next) {

  if (!req.invitation) {
    return next(new Error('Invalid invitation request'));
  }

  if (!req.body.data) {
    return next(new Error('Request data is required'));
  }

  var Domain = mongoose.model('Domain');
  var User = mongoose.model('User');
  var Invitation = mongoose.model('Invitation');
  var formValues = req.body.data;
  var invitation = req.invitation;

  var userJson = {
    firstname: formValues.firstname,
    lastname: formValues.lastname,
    password: formValues.password,
    emails: [req.invitation.data.email]
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
      if (domain) {
        return callback(new Error('Domain/company: ' + formValues.domain + '/' + formValues.company + ' already exist.' + err));
      }
    });
    callback();
  };

  var checkUser = function(callback) {
    userModule.findByEmail(userJson.emails, function(err, user) {
      if (err) {
        return callback(new Error('Unable to lookup user ' + userJson.emails + ': ' + err));
      } else if (user && user.emails) {
        return callback(new Error('User already exists'));
      }
    });
    callback();
  };

  var createUser = function(callback) {
    userModule.provisionUser(userJson, function(err, user) {
      if (err) {
        return callback(new Error('Cannot create user resources ' + err.message));
      }

      if (user) {
        var domain = {
          name: formValues.domain,
          company_name: formValues.company,
          administrator: user
        };
        return callback(null, domain, user);
      } else {
        return callback(new Error('Can not create user'));
      }
    });
  };

  var createDomain = function(domain, user, callback) {
    var domainObject = new Domain(domain);
    domainObject.save(function(err, saved) {
      if (err) {
        User.remove(user, function(err) {
          if (err) {
            return callback(new Error('Domain creation failed, cannot delete the user ' + err.message));
          }
          return callback(new Error('Cannot create domain resource, user deleted ' + err.message));
        });
      } else {
        return callback(null, saved, user);
      }
    });
  };

  var finalize = function(domain, user, callback) {
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

  async.waterfall([finalized, testDomainCompany, checkUser, createUser, createDomain, finalize, result], function(err, result) {
    if (err) {
      logger.error('Error while finalizing invitation', err);
      return next(err);
    } else if (result) {
      return res.json(201, result);
    }
  });
};
