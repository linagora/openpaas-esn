'use strict';

var mongoose = require('mongoose');
var UserNotification = mongoose.model('Usernotification');

var DEFAULT_LIMIT = 50;
var DEFAULT_OFFSET = 0;

module.exports.getForUser = function(user, query, callback) {
  query = query || {};
  var id = user._id || user;

  var q = {target: {objectType: 'user', id: id}};
  if (query.read !== undefined) {
    q.read = query.read;
  }

  var mq = UserNotification.find(q);
  mq.limit(query.limit || DEFAULT_LIMIT);
  mq.skip(query.offset || DEFAULT_OFFSET);
  mq.sort('-timestamps.creation');
  mq.exec(callback);
};

module.exports.countForUser = function(user, query, callback) {
  query = query || {};
  var id = user._id || user;

  var q = {target: {objectType: 'user', id: id}};
  if (query.read !== undefined) {
    q.read = query.read;
  }

  return UserNotification.count(q).exec(callback);
};
