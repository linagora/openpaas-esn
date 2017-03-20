'use strict';

const async = require('async');

module.exports = {
  checkIsTarget,
  userCanReadAllNotifications,
  userCanReadNotification,
  userCanWriteAllNotifications,
  userCanWriteNotification
};

function checkIsTarget(userId, usernotification) {
  if (usernotification && usernotification.target) {
    return usernotification.target + '' === userId + '';
  }

  return false;
}

function userCanReadNotification(req, res, next) {
  if (!checkIsTarget(req.user._id, req.usernotification)) {
    return res.status(403).json({error: {status: 403, message: 'Forbidden', details: 'User is not the notification target'}});
  }
  next();
}

function userCanReadAllNotifications(req, res, next) {
  async.every(req.usernotifications, checkUserNotifications, (err, result) => {
    if (!result) {
      return res.status(403).json({error: {status: 403, message: 'Forbidden', details: 'User is not the notifications target'}});
    }
    next();
  });

  function checkUserNotifications(usernotification, callback) {
    return callback(null, checkIsTarget(req.user._id, usernotification));
  }
}

function userCanWriteNotification(req, res, next) {
  return userCanReadNotification(req, res, next);
}

function userCanWriteAllNotifications(req, res, next) {
  return userCanReadAllNotifications(req, res, next);
}
