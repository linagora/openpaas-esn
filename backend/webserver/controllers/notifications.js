'use strict';

var notificationModule = require('../../core/notification/notification');

module.exports.create = function(req, res) {
  var n = req.body;
  n.author = req.user._id;
  notificationModule.save(n, function(err, notification) {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot create notification: ' + err.message}});
    }
    return res.status(201).json(notification);
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
    return res.status(200).json(req.notification);
  }
  return res.status(404).json({error: {status: 404, message: 'Not found', details: 'Notification has not been found'}});
};

module.exports.created = function(req, res) {
  var user_id = req.user._id;
  var options = {
    author: user_id
  };
  notificationModule.find(options, function(err, results) {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot get created notifications: ' + err.message}});
    }
    return res.status(200).json(results);
  });
};

module.exports.list = function(req, res) {
  var user_id = req.user._id;
  var read = req.query.read;

  var options = {
    'target.id': user_id
  };

  if (read !== 'all') {
    if (read === 'true') {
      options.read = true;
    } else if (read === 'false') {
      options.read = false;
    }
  }

  notificationModule.find(options, function(err, results) {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot get notifications: ' + err.message}});
    }
    return res.status(200).json(results);
  });
};

module.exports.setAsRead = function(req, res) {
  if (!req.notification) {
    return res.status(404).json({error: { status: 404, message: 'Not found', details: 'Notification has not been found'}});
  }

  notificationModule.setAsRead(req.notification, function(err, udated) {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot create set notification as read . ' + err.message}});
    }
    return res.status(205).end();
  });
};
