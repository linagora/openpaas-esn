'use strict';

var authorize = require('../middleware/authorization');
var notifications = require('../controllers/notifications');
var notificationMiddleware = require('../middleware/notification');

module.exports = function(router) {
  router.get('/notifications', authorize.requiresAPILogin, notifications.list);
  router.get('/notifications/created', authorize.requiresAPILogin, notifications.created);
  router.get('/notifications/:id', authorize.requiresAPILogin, notifications.load, notificationMiddleware.userCanReadNotification, notifications.get);
  router.post('/notifications', authorize.requiresAPILogin, notifications.create);
  router.put('/notifications/:id', authorize.requiresAPILogin, notifications.load, notificationMiddleware.userCanWriteNotification, notifications.setAsRead);
};
