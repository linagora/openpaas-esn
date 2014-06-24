'use strict';

var notificationModule = require('../../core/notification');

module.exports.create = function(req, res) {
  var n = req.body;
  n.author = req.user._id;
  notificationModule.save(n, function(err, notification) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot create notification: ' + err.message}});
    }
    return res.json(201, notification);
  });
};

function load(req, res, next) {
  if (req.params.id) {
    notificationModule.get(req.params.id, function(err, notification) {
      req.notification = notification;
      next();
    });
  } else {
    next();
  }
}
module.exports.load = load;

module.exports.get = function(req, res) {
  if (req.notification) {
    return res.json(200, req.notification);
  }
  return res.json(404, {error: {status: 404, message: 'Not found', details: 'Notification has not been found'}});
};

module.exports.created = function(req, res) {
  var user_id = req.user._id;
  var options = {
    author: user_id,
    parent: {'$exist': false}
  };
  notificationModule.find(options, function(err, results) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot get created notifications: ' + err.message}});
    }
    return res.json(200, results);
  });
};

module.exports.list = function(req, res) {
  var user_id = req.user._id;
  var read = req.param('read');

  var options = {
    target: {'$in': [user_id]}
  };

  if (read !== 'all') {
    options.read = Boolean.valueOf(read);
  }

  notificationModule.find(options, function(err, results) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot get notifications: ' + err.message}});
    }
    return res.json(200, results);
  });
};

module.exports.setAsRead = function(req, res) {
  if (!req.notification) {
    return res.json(404, {error: { status: 404, message: 'Not found', details: 'Notification has not been found'}});
  }

  notificationModule.setAsRead(req.notification, function(err, udated) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot create set notification as read . ' + err.message}});
    }
    return res.send(205);
  });
};
