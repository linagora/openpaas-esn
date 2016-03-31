'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    TechnicalUser = mongoose.model('TechnicalUser'),
    publicKeys = [
      '_id',
      'firstname',
      'lastname',
      'preferredEmail',
      'emails',
      'domains',
      'avatars',
      'job_title',
      'service',
      'building_location',
      'office_location',
      'main_phone',
      'features'
    ],
    privateKeys = ['accounts'];

function sanitizeUser(u, doNotKeepPrivateData) {
  var sanitizedUser = {},
      user = u instanceof User ? u : new User(u).toObject({ virtuals: true }); // So that we have mongoose virtuals
  var keys = publicKeys;

  if (!doNotKeepPrivateData) {
    keys = keys.concat(privateKeys);
  }

  keys.forEach(function(key) {
    if (user[key]) {
      sanitizedUser[key] = user[key];
    }
  });

  return sanitizedUser;
}

function sanitizeTechnicalUser(u) {
  return u instanceof TechnicalUser ? u.toJSON() : u;
}

module.exports = {
  sanitizeUser: sanitizeUser,
  sanitizeTechnicalUser: sanitizeTechnicalUser
};
