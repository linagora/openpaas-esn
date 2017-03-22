'use strict';

var authorize = require('../middleware/authorization');
var notifications = require('../controllers/notifications');
var notificationMiddleware = require('../middleware/notification');

module.exports = router => {

  /**
   * @swagger
   * /notifications:
   *   get:
   *     tags:
   *      - Notification
   *     description: List all the notifications where the target is the current user.
   *     parameters:
   *       - $ref: "#/parameters/nt_read"
   *     responses:
   *       200:
   *         $ref: "#/responses/nt_notifications"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/notifications', authorize.requiresAPILogin, notifications.list);

  /**
   * @swagger
   * /notifications/created:
   *   get:
   *     tags:
   *      - Notification
   *     description: List all the notifications where the author is the current user.
   *     responses:
   *       200:
   *         $ref: "#/responses/nt_notifications"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/notifications/created', authorize.requiresAPILogin, notifications.created);

  /**
   * @swagger
   * /notifications:
   *   post:
   *     tags:
   *      - Notification
   *     description: |
   *       Publish a new notification.
   *
   *       If the target contains multiple elements, the platform will create as many notifications as there are elements in the array plus the initial one.
   *     parameters:
   *       - $ref: "#/parameters/nt_notification"
   *     responses:
   *       201:
   *         $ref: "#/responses/nt_create"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/notifications', authorize.requiresAPILogin, notifications.create);

  /**
   * @swagger
   * /notifications/{id}:
   *   get:
   *     tags:
   *      - Notification
   *     description: Get a single notification from its ID even if it has been read.
   *     parameters:
   *       - $ref: "#/parameters/nt_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/nt_notification"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/notifications/:id', authorize.requiresAPILogin, notifications.load, notificationMiddleware.userCanReadNotification, notifications.get);

  /**
   * @swagger
   * /notifications/{id}:
   *   put:
   *     tags:
   *      - Notification
   *     description:
   *       Mark the notification with given id as read.
   *     parameters:
   *       - $ref: "#/parameters/nt_id"
   *     responses:
   *       205:
   *         $ref: "#/responses/cm_205"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/notifications/:id', authorize.requiresAPILogin, notifications.load, notificationMiddleware.userCanWriteNotification, notifications.setAsRead);
};
