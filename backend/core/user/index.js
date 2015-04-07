'use strict';

var util = require('util');
var esnConfig = require('../../core')['esn-config'];
var logger = require('../logger');
var extend = require('extend');
var mongoose = require('mongoose');
var trim = require('trim');
var User = mongoose.model('User');
var emailAddresses = require('email-addresses');

function getUserTemplate(callback) {
  esnConfig('user', 'templates').get(callback);
}

function extendUserTemplate(template, data) {
  extend(template, data);
}

function recordUser(userData, callback) {
  var userAsModel = userData instanceof User ? userData : new User(userData);
  userAsModel.save(function(err, resp) {
    if (!err) {
      logger.info('User provisioned in datastore:', userAsModel.emails.join(','));
    } else {
      logger.warn('Error while trying to provision user in database:', err.message);
    }
    callback(err, resp);
  });
}

module.exports.recordUser = recordUser;

module.exports.provisionUser = function(data, callback) {
  getUserTemplate(function(err, user) {
    if (err) {
      return callback(err);
    }
    delete user._id;
    extendUserTemplate(user, data);
    recordUser(user, callback);
  });
};

module.exports.findByEmail = function(email, callback) {
  var query;
  if (util.isArray(email)) {
    var emails = email.map(function(e) {
      return trim(e).toLowerCase();
    });
    query = { $or: emails.map(function(e) { return {emails: e}; }) };
  } else {
    var qemail = trim(email).toLowerCase();
    query = {emails: qemail};
  }
  User.findOne(query, callback);
};

module.exports.get = function(uuid, callback) {
  User.findOne({_id: uuid}, callback);
};

module.exports.updateProfile = function(user, parameter, value, callback) {
  //unlike user and parameter, value cannot be null but can be empty
  if (!user || !parameter || value === undefined) {
    return callback(new Error('User, parameter and value are required'));
  }

  var id = user._id || user;
  var update = {};
  update[parameter] = value;
  User.update({_id: id}, {$set: update}, callback);
};

module.exports.belongsToCompany = function(user, company, callback) {
  if (!user || !company) {
    return callback(new Error('User and company are required.'));
  }
  var hasCompany = user.emails.some(function(email) {
    var domain = emailAddresses.parseOneAddress(email).domain.toLowerCase();
    var domainWithoutSuffix = domain.split('.')[0].toLowerCase();
    return domain === company.toLowerCase() || domainWithoutSuffix === company.toLowerCase();
  });
  return callback(null, hasCompany);
};

module.exports.getCompanies = function(user, callback) {
  if (!user) {
    return callback(new Error('User is required.'));
  }
  var companies = user.emails.map(function(email) {
    var parsedEmail = emailAddresses.parseOneAddress(email);
    return parsedEmail.domain.split('.')[0];
  });
  return callback(null, companies);
};

module.exports.domain = require('./domain');
