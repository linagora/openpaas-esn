'use strict';

var configured = require('../configured');

var user = require('./user');
module.exports.user = user;

module.exports.inject = function(callback) {
  if (!configured()) {
    console.log('DB is not configured, templates will not be injected');
    callback();
    return;
  }
  user.store(function(err) {
    if (err) {
      console.log('user template cannot be injected into database', err);
    }
    callback.apply(this, arguments);
  });
};
