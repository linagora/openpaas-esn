'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    TechnicalUser = mongoose.model('TechnicalUser');

function sanitizeUser(u) {
  var sanitizedUser = {},
      user = u instanceof User ? u : new User(u).toObject({ virtuals: true }); // So that we have mongoose virtuals

  ['_id', 'firstname', 'lastname', 'preferredEmail', 'emails', 'domains', 'avatars', 'accounts', 'job_title', 'service', 'building_location', 'office_location', 'main_phone'].forEach(function(key) {
    if (user[key]) {
      sanitizedUser[key] = user[key];
    }
  });

  return sanitizedUser;
}

function sanitizeTechnicalUser(u) {
  return u instanceof TechnicalUser ? u : new TechnicalUser(u).toObject({ virtuals: true });
}

module.exports = {
  sanitizeUser: sanitizeUser,
  sanitizeTechnicalUser: sanitizeTechnicalUser
};
