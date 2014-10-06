'use strict';

var notificationModule = require('../../core/notification/user');
var logger = require('../../core/logger');

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

  notificationModule.getForUser(user, query, function(err, notifications) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }

    notifications = notifications || [];

    notificationModule.countForUser(user, query, function(err, count) {
      if (err) {
        logger.warn('Can not count user notification : ' + err.message);
        count = notifications.length;
      }
      res.header('X-ESN-Items-Count', count);
      return res.json(200, notifications);
    });
  });
};
