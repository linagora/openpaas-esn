'use strict';

var mongoose = require('mongoose');
var userModule = require('../..').user;
var logger = require('../..').logger;
var invitation, data;

module.exports.initHelper = function(invit, formValues) {
  invitation = invit;
  data = formValues;
};

module.exports.isInvitationFinalized = function(callback) {
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
};

module.exports.testDomainCompany = function(callback) {
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
};

module.exports.checkUser = function(callback) {
  userModule.findByEmail(invitation.data.email, function(err, user) {
    if (err) {
      return callback(new Error('Unable to lookup user ' + invitation.data.emails + ': ' + err));
    } else if (user && user.emails) {
      return callback(new Error('User already exists'));
    }
  });
  callback();
};

module.exports.createUser = function(callback) {
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
};

module.exports.finalizeInvitation = function(domain, user, callback) {
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
};
