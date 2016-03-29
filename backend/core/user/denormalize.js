'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');

function getId(user) {
  return user._id;
}
module.exports.getId = getId;

function denormalize(user) {

  function transform(doc, ret) {
    ret.id = getId(ret);
    delete ret.password;
  }
  var options = {virtuals: true, transform: transform};
  return user instanceof User ? user.toObject(options) : new User(user).toObject(options);
}
module.exports.denormalize = denormalize;
