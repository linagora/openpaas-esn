'use strict';

var notificationModule = require('../../core/notification/usernotification');
var logger = require('../../core/logger');

function getUnreadCount(req, res) {
  var query = {
    read: false
  };
  notificationModule.countForUser(req.user._id.toString(), query, function(err, count) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot get unread notification for current user: ' + err.message}});
    }
    return res.json(200, { unread_count: count });
  });
}
module.exports.getUnreadCount = getUnreadCount;

module.exports.list = function(req, res) {
  var user = req.user;

  var query = {};
  if (req.param('limit')) {
    var limit = parseInt(req.param('limit'), 10);
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  if (req.param('offset')) {
    var offset = parseInt(req.param('offset'), 10);
    if (!isNaN(offset)) {
      query.offset = offset;
    }
  }

  if (req.param('read') === 'true') {
    query.read = true;
  }
  if (req.param('read') === 'false') {
    query.read = false;
  }

  notificationModule.getForUser(user._id.toString(), query, function(err, notifications) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }

    notifications = notifications || [];

    notificationModule.countForUser(user._id.toString(), query, function(err, count) {
      if (err) {
        logger.warn('Can not count user notification : ' + err.message);
        count = notifications.length;
      }
      res.header('X-ESN-Items-Count', count);
      return res.json(200, notifications);
    });
  });
};

function load(req, res, next) {
  if (req.params.id) {
    notificationModule.get(req.params.id, function(err, usernotification) {
      if (err) {
        return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot load user notification: ' + err.message}});
      }
      if (!usernotification) {
        return res.json(404, {error: { status: 404, message: 'Not found', details: 'The user notification has not been found'}});
      }
      req.usernotification = usernotification;
      next();
    });
  } else {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'Missing parameter id'}});
  }
}
module.exports.load = load;

function loadAll(req, res, next) {
  if (!req.query || !req.query.ids) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'Missing ids in query'}});
  }

  if (!(req.query.ids instanceof Array)) {
    req.query.ids = [req.query.ids];
  }

  notificationModule.getAll(req.query.ids, function(err, usernotifications) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot load user notifications: ' + err.message}});
    }

    usernotifications = usernotifications || [];
    if (usernotifications.length === 0) {
      return res.json(404, {error: { status: 404, message: 'Not found', details: 'No user notifications have not been found'}});
    }

    var foundIds = usernotifications.map(function(usernotification) {
      return usernotification._id.toString();
    });

    req.query.ids.filter(function(id) {
      return foundIds.indexOf(id) < 0;
    }).forEach(function(id) {
      logger.warn('The usernotification ' + id + ' can not be found');
    });
    req.usernotifications = usernotifications;
    next();
  });
}
module.exports.loadAll = loadAll;

function setRead(req, res) {

  if (!req.body) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'Request body is not defined'}});
  }

  if (req.body.value !== true && req.body.value !== false) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'body value parameter is not boolean'}});
  }

  notificationModule.setRead(req.usernotification, req.body.value, function(err) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot set the user notification as read: ' + err.message}});
    }
    return res.send(205);
  });
}

module.exports.setRead = setRead;

function setAllRead(req, res) {

  if (!req.body) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'Request body is not defined'}});
  }

  if (req.body.value !== true && req.body.value !== false) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'body value parameter is not boolean'}});
  }

  notificationModule.setAllRead(req.usernotifications, req.body.value, function(err) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot set the user notifications as read: ' + err.message}});
    }
    return res.send(205);
  });
}

module.exports.setAllRead = setAllRead;

function setAcknowledged(req, res) {

  if (!req.body) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'Request body is not defined'}});
  }

  if (req.body.value !== true && req.body.value !== false) {
    return res.json(400, {error: { status: 400, message: 'Bad request', details: 'body value parameter is not boolean'}});
  }

  notificationModule.setAcknowledged(req.usernotification, req.body.value, function(err) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot set the user notification as acknowledged: ' + err.message}});
    }
    return res.send(205);
  });
}

module.exports.setAcknowledged = setAcknowledged;
