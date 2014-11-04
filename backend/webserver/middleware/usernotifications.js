'use strict';

var async = require('async');

function checkIsTarget(userId, usernotification) {
  if (usernotification && usernotification.target) {
      return usernotification.target + '' === userId + '';
  }
  return false;
}

var userCanReadNotification = function(req, res, next) {
  if (!checkIsTarget(req.user._id, req.usernotification)) {
    return res.json(403, {error: {status: 403, message: 'Forbidden', details: 'User is not the notification target'}});
  }
  next();
};
module.exports.userCanReadNotification = userCanReadNotification;

var userCanReadAllNotifications = function(req, res, next) {
  function checkUserNotifications(usernotification, callback) {
    return callback(checkIsTarget(req.user._id, usernotification));
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
