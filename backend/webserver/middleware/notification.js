'use strict';

var userCanReadNotification = function(req, res, next) {
  if (!req.user || !req.notification) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user or notification'});
  }

  if (req.notification.author.equals(req.user._id)) {
    return next();
  }

  var isInTarget = req.notification.target.some(function(item) {
    return item.id.equals(req.user._id);
  });

  if (!isInTarget) {
    return res.status(403).json({error: 403, message: 'Forbidden', details: 'User is not the notification target'});
  }

  next();
};
module.exports.userCanReadNotification = userCanReadNotification;

var userCanWriteNotification = function(req, res, next) {
  return userCanReadNotification(req, res, next);
};
module.exports.userCanWriteNotification = userCanWriteNotification;
