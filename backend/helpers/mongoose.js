'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');

module.exports.userToJSON = function(user) {
  return user instanceof User ? user : new User(user).toObject({ virtuals: true });
};
