'use strict';

var util = require('util');
var esnConfig = require(__dirname + '/../../core')['esn-config'];
var logger = require(__dirname + '/../../core').logger;
var extend = require('extend');
var mongoose = require('mongoose');
var trim = require('trim');
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
  if (!user || !parameter || !value) {
    return callback(new Error('User, parameter and value are required'));
  }

  var id = user._id || user;
  var update = {};
  update[parameter] = value;
  User.update({_id: id}, {$set: update}, callback);
};
