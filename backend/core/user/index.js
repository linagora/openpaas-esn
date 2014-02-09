'use strict';

var util = require('util');
var esnConfig = require(__dirname + '/../../core')['esn-config'];
var logger = require(__dirname + '/../../core').logger;
var extend = require('extend');
var mongoose = require('mongoose');
var User = mongoose.model('User');

function getUserTemplate(callback) {
  esnConfig('user', 'templates').get(callback);
}

function extendUserTemplate(template, data) {
  extend(template, data);
}

function recordUser(userData, callback) {
  var user = new User(userData);
  user.save(function(err, resp) {
    if (!err) {
      logger.info('User provisioned in datastore:', userData.emails.join(','));
    } else {
      logger.warn('Error while trying to provision user in database:', err.message);
    }
    callback(err, resp);
  });
}

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
    query = { $or: email.map(function(e) { return {emails: e}; }) };
  } else {
    query = {emails: email};
  }
  User.findOne(query, callback);
};
