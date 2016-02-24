'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Community = mongoose.model('Community');

module.exports.userToJSON = function(user) {
  return user instanceof User ? user : new User(user).toObject({ virtuals: true });
};

module.exports.communityToJSON = function(community) {
  return community instanceof Community ? community : new Community(community).toObject({ virtuals: true });
};
