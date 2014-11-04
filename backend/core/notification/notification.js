'use strict';

var mongoose = require('mongoose');
var Notification = mongoose.model('Notification');
var pubsub = require('../pubsub').local;
var topic = pubsub.topic('notification:external');
var helpersTargets = require('../../helpers/targets');

module.exports.save = function(notification, callback) {
  if (!notification) {
    return callback(new Error('Notification can not be null'));
  }

  helpersTargets.getUserIds(notification.target, function(err, users) {
    if (err) {
      return callback(err);
    }

    users.forEach(function(user) {
      var userId = user._id;
      var context = user.context;

      var data = {
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
    return callback(null, notification);
  });

};

module.exports.get = function(id, callback) {
  if (!id) {
    return callback(new Error('Notification ID is not defined'));
  }
  return Notification.findById(id).exec(callback);
};

module.exports.find = function(options, callback) {
  options = options || {};
  Notification.find(options).exec(callback);
};

module.exports.setAsRead = function(notification, callback) {
  if (!notification) {
    return callback(new Error('Notification is required'));
  }
  notification.read = true;
  notification.save(callback);
};


