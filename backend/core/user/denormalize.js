'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');

function userToJSON(user) {
  return user instanceof User ? user.toObject({ virtuals: true }) : new User(user).toObject({ virtuals: true });
}

function denormalize(user) {
  var document = userToJSON(user);
  document.id = document._id;
  delete document.password;
  return document;
}
module.exports = denormalize;
