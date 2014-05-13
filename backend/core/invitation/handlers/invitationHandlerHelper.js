'use strict';

var mongoose = require('mongoose');
var userModule = require('../..').user;
var logger = require('../..').logger;
var Domain = mongoose.model('Domain');
var User = mongoose.model('User');

module.exports.initHelper = function(invitation, data) {

  return {
    isInvitationFinalized: function(callback) {
      var Invitation = mongoose.model('Invitation');
      Invitation.isFinalized(invitation.uuid, function(err, finalized) {
        if (err) {
          return callback(new Error('Can not check invitation status'));
        }

        if (finalized) {
          return callback(new Error('Invitation is already finalized'));
        }
        callback();
      });
    },

    testDomainCompany: function(callback) {
      var Domain = mongoose.model('Domain');
      Domain.testDomainCompany(data.company, data.domain, function(err, domain) {
        if (err) {
          return callback(new Error('Unable to lookup domain/company: ' + data.domain + '/' + data.company + err));
        }
        if (domain) {
          return callback(new Error('Domain/company: ' + data.domain + '/' + data.company + ' already exist.' + err));
        }
      });
      callback();
    },

    testDomainExists: function(callback) {
      Domain.testDomainCompany(data.company, data.domain, function(err, foundDomain) {
        if (err) {
          return callback(new Error('Unable to lookup domain/company: ' + data.domain + '/' + data.company + err));
        }
        if (!foundDomain) {
          return callback(new Error('Domain/company: ' + data.domain + '/' + data.company + ' do not exist.' + err));
        }
        callback(foundDomain);
      });
    },

    checkUser: function(callback) {
      userModule.findByEmail(invitation.data.email, function(err, user) {
        if (err) {
          return callback(new Error('Unable to lookup user ' + invitation.data.emails + ': ' + err));
        } else if (user && user.emails) {
          return callback(new Error('User already exists'));
        }
      });
      callback();
    },

    createUser: function(callback) {
      var userJson = {
        firstname: data.firstname,
        lastname: data.lastname,
        password: data.password,
        emails: [invitation.data.email]
      };
      userModule.provisionUser(userJson, function(err, user) {
        if (err) {
          return callback(new Error('Cannot create user resources ' + err.message));
        }

        if (user) {
          return callback(null, user);
        } else {
          return callback(new Error('Can not create user'));
        }
      });
    },

    createDomain: function(user, callback) {
      var domain = {
        name: data.domain,
        company_name: data.company,
        administrator: user
      };
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
    },

    addUserToDomain: function(domain, user, callback) {
      user.joinDomain(domain, function(err, update) {
        if (err) {
          return callback(new Error('User cannot join domain' + err.message));
        }
        else {
          callback(null, domain, user);
        }
      });
    },

    finalizeInvitation: function(domain, user, callback) {
      var Invitation = mongoose.model('Invitation');
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
    },

    result: function(domain, user, callback) {
      var result = {
        status: 'created',
        resources: {
          user: user._id,
          domain: domain._id
        }
      };
      callback(null, result);
    }
  };

};
