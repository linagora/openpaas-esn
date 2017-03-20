'use strict';

const logger = require('../../core/logger');
const notificationModule = require('../../core/notification/usernotification');

module.exports = {
  getUnreadCount,
  list,
  load,
  loadAll,
  setAcknowledged,
  setAllRead,
  setRead
};

function getUnreadCount(req, res) {
  const query = {
    read: false
  };

  notificationModule.countForUser(req.user._id.toString(), query, (err, count) => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot get unread notification for current user: ' + err.message}});
    }
    res.status(200).json({ unread_count: count });
  });
}

function list(req, res) {
  const user = req.user;
  const query = {};

  if (req.query.limit) {
    const limit = parseInt(req.query.limit, 10);

    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.query.offset) {
    const offset = parseInt(req.query.offset, 10);

    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  if (req.query.read === 'true') {
    query.read = true;
  }
  if (req.query.read === 'false') {
    query.read = false;
  }

  notificationModule.getForUser(user._id.toString(), query, (err, notifications) => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.details}});
    }

    notifications = notifications || [];

    notificationModule.countForUser(user._id.toString(), query, (err, count) => {
      if (err) {
        logger.warn('Can not count user notification : ' + err.message);
        count = notifications.length;
      }
      res.header('X-ESN-Items-Count', count);
      res.status(200).json(notifications);
    });
  });
}

function load(req, res, next) {
  if (req.params.id) {
    notificationModule.get(req.params.id, (err, usernotification) => {
      if (err) {
        return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot load user notification: ' + err.message}});
      }

      if (!usernotification) {
        return res.status(404).json({error: { status: 404, message: 'Not found', details: 'The user notification has not been found'}});
      }

      req.usernotification = usernotification;
      next();
    });
  } else {
    res.status(400).json({error: { status: 400, message: 'Bad request', details: 'Missing parameter id'}});
  }
}

function loadAll(req, res, next) {
  if (!req.query || !req.query.ids) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'Missing ids in query'}});
  }

  if (!(req.query.ids instanceof Array)) {
    req.query.ids = [req.query.ids];
  }

  notificationModule.getAll(req.query.ids, (err, usernotifications) => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot load user notifications: ' + err.message}});
    }

    usernotifications = usernotifications || [];
    if (usernotifications.length === 0) {
      return res.status(404).json({error: { status: 404, message: 'Not found', details: 'No user notifications have not been found'}});
    }

    const foundIds = usernotifications.map(usernotification => usernotification._id.toString());

    req.query.ids
      .filter(id => foundIds.indexOf(id) < 0)
      .forEach(id => logger.warn(`usernotification ${id} can not be found`));

    req.usernotifications = usernotifications;
    next();
  });
}

function setAcknowledged(req, res) {
  if (!req.body) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'Request body is not defined'}});
  }

  if (req.body.value !== true && req.body.value !== false) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'body value parameter is not boolean'}});
  }

  notificationModule.setAcknowledged(req.usernotification, req.body.value, err => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot set the user notification as acknowledged: ' + err.message}});
    }
    res.status(205).end();
  });
}

function setAllRead(req, res) {
  if (!req.body) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'Request body is not defined'}});
  }

  if (req.body.value !== true && req.body.value !== false) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'body value parameter is not boolean'}});
  }

  notificationModule.setAllRead(req.usernotifications, req.body.value, err => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot set the user notifications as read: ' + err.message}});
    }
    res.status(205).end();
  });
}

function setRead(req, res) {
  if (!req.body) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'Request body is not defined'}});
  }

  if (req.body.value !== true && req.body.value !== false) {
    return res.status(400).json({error: { status: 400, message: 'Bad request', details: 'body value parameter is not boolean'}});
  }

  notificationModule.setRead(req.usernotification, req.body.value, err => {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot set the user notification as read: ' + err.message}});
    }
    res.status(205).end();
  });
}
