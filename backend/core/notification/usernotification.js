'use strict';

const async = require('async');
const mongoose = require('mongoose');
const UserNotification = mongoose.model('Usernotification');

const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;

module.exports = {
  countForUser,
  create,
  get,
  getAll,
  getForUser,
  remove,
  setAcknowledged,
  setAllRead,
  setRead
};

function countForUser(user, query, callback) {
  const id = user._id || user;
  const q = {target: id, acknowledged: false};

  query = query || {};

  if (query.read !== undefined) {
    q.read = query.read;
  }

  return UserNotification.count(q).exec(callback);
}

function create(usernotification, callback) {
  if (!usernotification) {
    return callback(new Error('usernotification is required'));
  }

  new UserNotification(usernotification).save(callback);
}

function get(id, callback) {
  if (!id) {
    return callback(new Error('id is not defined'));
  }

  return UserNotification.findById(id).exec(callback);
}

function getAll(ids, callback) {
  if (!ids) {
    return callback(new Error('id is not defined'));
  }

  const formattedIds = ids.map(id => mongoose.Types.ObjectId(id));
  const query = { _id: { $in: formattedIds } };

  return UserNotification.find(query).exec(callback);
}

function getForUser(user, query, callback) {
  const id = user._id || user;
  const q = {target: id, acknowledged: false};

  query = query || {};

  if (query.read !== undefined) {
    q.read = query.read;
  }

  const mq = UserNotification.find(q);

  mq.limit(+query.limit || DEFAULT_LIMIT);
  mq.skip(+query.offset || DEFAULT_OFFSET);
  mq.sort('-timestamps.creation');
  mq.exec(callback);
}

function remove(query, callback) {
  UserNotification.remove(query, callback);
}

function setAcknowledged(usernotification, acknowledged, callback) {
  if (!usernotification) {
    return callback(new Error('usernotification is required'));
  }

  usernotification.acknowledged = acknowledged;
  usernotification.save(callback);
}

function setAllRead(usernotifications, read, callback) {
  if (!usernotifications) {
    return callback(new Error('usernotification is required'));
  }

  async.each(usernotifications, setRead, callback);

  function setRead(usernotification, cb) {
    usernotification.read = read;
    usernotification.save(cb);
  }
}

function setRead(usernotification, read, callback) {
  if (!usernotification) {
    return callback(new Error('usernotification is required'));
  }

  usernotification.read = read;
  usernotification.save(callback);
}
