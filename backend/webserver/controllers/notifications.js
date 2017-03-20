'use strict';

const notificationModule = require('../../core/notification/notification');

module.exports = {
  create,
  created,
  get,
  list,
  load,
  setAsRead
};

function create(req, res) {
  const notification = req.body;

  notification.author = req.user._id;
  notificationModule.save(notification, (err, result) => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot create notification: ' + err.message}});
    }

    res.status(201).json(result);
  });
}

function created(req, res) {
  const user_id = req.user._id;
  const options = {
    author: user_id
  };

  notificationModule.find(options, (err, results) => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot get created notifications: ' + err.message}});
    }

    res.status(200).json(results);
  });
}

function get(req, res) {
  if (req.notification) {
    return res.status(200).json(req.notification);
  }

  res.status(404).json({error: {status: 404, message: 'Not found', details: 'Notification has not been found'}});
}

function list(req, res) {
  const user_id = req.user._id;
  const read = req.query.read;
  const options = {
    'target.id': user_id
  };

  if (read !== 'all') {
    if (read === 'true') {
      options.read = true;
    } else if (read === 'false') {
      options.read = false;
    }
  }

  notificationModule.find(options, (err, results) => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot get notifications: ' + err.message}});
    }

    res.status(200).json(results);
  });
}

function load(req, res, next) {
  if (req.params.id) {
    notificationModule.get(req.params.id, (err, notification) => {
      req.notification = notification;
      next();
    });
  } else {
    next();
  }
}

function setAsRead(req, res) {
  if (!req.notification) {
    return res.status(404).json({error: { status: 404, message: 'Not found', details: 'Notification has not been found'}});
  }

  notificationModule.setAsRead(req.notification, err => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot create set notification as read . ' + err.message}});
    }

    res.status(205).end();
  });
}
