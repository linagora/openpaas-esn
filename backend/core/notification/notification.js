'use strict';

var mongoose = require('mongoose');
var Notification = mongoose.model('Notification');
var pubsub = require('../pubsub').global;
var async = require('async');
var topic = pubsub.topic('notification:api');

var saveOne = function(notification, parent, callback) {
  if (!notification) {
    return callback(new Error('Notification can not be null'));
  }

  var n = new Notification(notification);
  if (parent) {
    n.parent = parent._id || parent;
  }
  n.save(function(err, saved) {
    if (err) {
      return callback(err);
    }
    topic.publish(saved);
    return callback(null, saved);
  });
};
module.exports.saveOne = saveOne;

module.exports.save = function(notification, callback) {
  function sendCallback(err, children, parent) {
    if (parent) {
      topic.publish(parent);
    }
    callback(err, children);
  }

  if (!notification) {
    return callback(new Error('Notification can not be null'));
  }

  this.saveOne(notification, null, function(err, parent) {
    if (err) {
      return sendCallback(err);
    }

    if (notification.target.length === 1) {
      return sendCallback(err, [parent], parent);
    }

    var result = [parent];
    async.eachLimit(notification.target, 10, function(target, callback) {
      var n = {
        title: notification.title,
        author: notification.author,
        action: notification.action,
        object: notification.object,
        link: notification.link,
        level: notification.level,
        timestamps: parent.timestamps,
        target: [target],
        data: notification.data || {}
      };
      return saveOne(n, parent, function(err, _n) {
        if (_n) {
          result.push(_n);
        }
        // never fails
        return callback();
      });
    }, function(err) {
      if (err) {
        console.log('Fail to save notification');
      }
      return callback(err, result);
    });
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


