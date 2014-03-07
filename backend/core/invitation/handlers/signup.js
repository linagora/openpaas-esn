'use strict';

var emailAddresses = require('email-addresses');
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
  var formValues = req.body.data;


  Domain.testDomainCompany(formValues.company, formValues.domain, function(err, domain) {
    if (err) {
      return next(new Error('Unable to lookup domain/company: ' + formValues.domain + '/' + formValues.company + err));
    }
    if (domain) {
      return next(new Error('Domain/company: ' + formValues.domain + '/' + formValues.company + ' already exist.' + err));
    }

    var userJson = {
      firstname: formValues.firstname,
      lastname: formValues.lastname,
      password: formValues.password,
      emails: [req.invitation.data.email]
    };

    userModule.findByEmail(userJson.emails, function(err, user) {
      if (err) {
        return next(new Error('Unable to lookup user ' + userJson.emails + ': ' + err));
      } else if (user && user.emails) {
        return next(new Error('User already exists'));
      }

      userModule.provisionUser(userJson, function(err, user) {
        if (err) {
          return next(new Error('Cannot create user resources ' + err.message));
        }

        if (user) {
          var domainJson = {
            name: formValues.domain,
            company_name: formValues.company,
            administrator: user
          };

          var domainObject = new Domain(domainJson);
          domainObject.save(function(err, domain) {
            if (err) {
              User.remove(user, function(err) {
                if (err) {
                  return next(new Error('Domain creation failed, cannot delete the user ' + err.message));
                }
                return next(new Error('Cannot create domain resource, user deleted ' + err.message));
              });
            }
            if (domain) {
              var result = {
                status: 'created',
                resources: {
                  user: user._id,
                  domain: domain._id
                }
              };

              return res.json(201, result);
            }
          });
        }
      });
    });
  });
};
