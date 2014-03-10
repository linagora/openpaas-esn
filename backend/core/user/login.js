'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var config = require('../esn-config')('login');
var pubsub = require('../pubsub').local;
var defaultLoginFailure = 5;

module.exports.success = function(email, cb) {
  User.loadFromEmail(email, function(err, user) {
    if (err) {
      return cb(err);
    }
    pubsub.topic('login.success').publish(user);
    user.loginSuccess(cb);
  });
};

module.exports.failure = function(email, cb) {
  User.loadFromEmail(email, function(err, user) {
    if (err) {
      return cb(err);
    }
    pubsub.topic('login.failure').publish(user);
    user.loginFailure(cb);
  });
};

module.exports.canLogin = function(email, cb) {
  var size = defaultLoginFailure;
  config.get(function(err, data) {
    if (data && data.failure && data.failure.size) {
      size = data.failure.size;
    }

    User.loadFromEmail(email, function(err, user) {
      if (err) {
        return cb(err);
      }

      if (user.login.failures && user.login.failures.length >= size) {
        return cb(null, false);
      }
      return cb(err, true);
    });
  });
};

