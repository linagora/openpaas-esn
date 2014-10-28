'use strict';

var async = require('async');

function checkIsInTarget(userId, usernotification) {
  return usernotification.target.some(function(item) {
    return item.id === userId;
  });
}

var userCanReadNotification = function(req, res, next) {
  if (!checkIsInTarget(req.user._id.toString(), req.usernotification)) {
    return res.json(403, {error: {status: 403, message: 'Forbidden', details: 'User is not the notification target'}});
  }
  next();
};
module.exports.userCanReadNotification = userCanReadNotification;

var userCanReadAllNotifications = function(req, res, next) {
  function checkUserNotifications(usernotification, callback) {
    return callback(checkIsInTarget(req.user._id.toString(), usernotification));
  }
  async.every(req.usernotifications, checkUserNotifications, function(result) {
    if (!result) {
      return res.json(403, {error: {status: 403, message: 'Forbidden', details: 'User is not the notifications target'}});
    }
    next();
  });
};
module.exports.userCanReadAllNotifications = userCanReadAllNotifications;

var userCanWriteNotification = function(req, res, next) {
  return userCanReadNotification(req, res, next);
};
module.exports.userCanWriteNotification = userCanWriteNotification;

var userCanWriteAllNotifications = function(req, res, next) {
  return userCanReadAllNotifications(req, res, next);
};
module.exports.userCanWriteAllNotifications = userCanWriteAllNotifications;
