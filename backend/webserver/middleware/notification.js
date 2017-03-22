'use strict';

module.exports = {
  userCanReadNotification,
  userCanWriteNotification
};

function userCanReadNotification(req, res, next) {
  if (!req.user || !req.notification) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing user or notification'});
  }

  if (req.notification.author.equals(req.user._id)) {
    return next();
  }

  const isInTarget = req.notification.target.some(item => item.id.equals(req.user._id));

  if (!isInTarget) {
    return res.status(403).json({error: 403, message: 'Forbidden', details: 'User is not the notification target'});
  }

  next();
}

function userCanWriteNotification(req, res, next) {
  return userCanReadNotification(req, res, next);
}
