'use strict';

const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');
const pubsub = require('../pubsub').local;
const topic = pubsub.topic('notification:external');
const helpersTargets = require('../../helpers/targets');

module.exports = {
  get,
  find,
  save,
  setAsRead
};

function get(id, callback) {
  if (!id) {
    return callback(new Error('Notification ID is not defined'));
  }

  Notification.findById(id).exec(callback);
}

function find(options, callback) {
  options = options || {};
  Notification.find(options).exec(callback);
}

function save(notification, callback) {
  if (!notification) {
    return callback(new Error('Notification can not be null'));
  }

  helpersTargets.getUserIds(notification.target, (err, users) => {
    if (err) {
      return callback(err);
    }

    users.forEach(user => {
      const userId = user._id;
      const context = user.context;
      const data = {
        title: notification.title,
        author: notification.author,
        action: notification.action,
        object: notification.object,
        link: notification.link,
        level: notification.level,
        timestamps: notification.timestamps,
        target: userId,
        data: notification.data || {},
        context: context
      };

      topic.publish(data);
    });

    callback(null, notification);
  });
}

function setAsRead(notification, callback) {
  if (!notification) {
    return callback(new Error('Notification is required'));
  }

  notification.read = true;
  notification.save(callback);
}
