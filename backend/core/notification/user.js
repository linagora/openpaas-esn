'use strict';

var mongoose = require('mongoose');
var UserNotification = mongoose.model('UserNotification');

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

module.exports.getForUser = function(user, query, callback) {
  query = query || {};
  var id = user._id || user;

  var q = {'target.objectType' : 'user', 'subject.id': id};
  if (query.read !== undefined) {
    q.read = query.read;
  }

  return UserNotification.find(q).limit(query.limit || DEFAULT_LIMIT).skip(query.offset || DEFAULT_OFFSET).sort('-timestamps.creation').exec(callback);
};

module.exports.countForUser = function(user, query, callback) {
  query = query || {};
  var id = user._id || user;

  var q = {'target.objectType' : 'user', 'subject.id': id};
  if (query.read) {
    q.read = query.read;
  }

  return UserNotification.count(q).exec(callback);
};