'use strict';

var userCanReadNotification = function(req, res, next) {

  var isInTarget = req.usernotification.target.some(function(item) {
    return item.id.equals(req.user._id);
  });

  if (!isInTarget) {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'User is not the notification target'});
  }

  next();
};
module.exports.userCanReadNotification = userCanReadNotification;

var userCanWriteNotification = function(req, res, next) {
  return userCanReadNotification(req, res, next);
};
module.exports.userCanWriteNotification = userCanWriteNotification;
