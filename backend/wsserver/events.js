'use strict';

var logger = require('../core/logger'),
    activitystreams = require('./notification/activitystreams'),
    notifications = require('./notification/notifications'),
    usernotifications = require('./notification/usernotifications'),
    collaboration = require('./notification/collaboration');

module.exports = function(io) {
  io.on('connection', function() {
    logger.info('Got a connection in the events module on socket');
  });
  activitystreams.init(io);
  notifications.init(io);
  usernotifications.init(io);
  collaboration.init(io);
};
