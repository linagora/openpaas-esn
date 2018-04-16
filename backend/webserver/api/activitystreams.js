'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var activitystreams = require('../controllers/activitystreams');
var asMiddleware = require('../middleware/activitystream');
var messageMiddleware = require('../middleware/message');

module.exports = function(router) {
  /**
   * @swagger
   * /activitystreams/{uuid} :
   *   get:
   *     tags:
   *       - ActivityStreams
   *     description: Gets the timeline of an activity stream from its uuid.
   *     parameters:
   *       - $ref: "#/parameters/as_uuid"
   *       - $ref: "#/parameters/as_before"
   *       - $ref: "#/parameters/as_after"
   *       - $ref: "#/parameters/as_limit"
   *     responses:
   *       200:
   *         $ref: "#/responses/as_timeline"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/activitystreams/:uuid', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.get);

  /**
   * @swagger
   * /activitystreams/{uuid}/resource :
   *   get:
   *     tags:
   *       - ActivityStreams
   *     description: Gets the resource associated with the activitystream.
   *     parameters:
   *       - $ref: "#/parameters/as_uuid"
   *     responses:
   *       200:
   *         $ref: "#/responses/as_resource"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.get('/activitystreams/:uuid/resource', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.getResource);

  /**
   * @swagger
   * /activitystreams/{uuid}/unreadcount :
   *   get:
   *     tags:
   *      - ActivityStreams
   *     description: |
   *       Get the number of unreads timeline entries of an activity stream from its uuid for the current user.
   *
   *       The last timeline entry read is updated each time `GET /api/activitystreams/{uuid}` is send.
   *     parameters:
   *       - $ref: "#/parameters/as_uuid"
   *     responses:
   *       200:
   *         $ref: "#/responses/as_unreadcount"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/activitystreams/:uuid/unreadcount', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.getUnreadCount);

  /**
   * Delete a message from an activitystream.
   * Deleting a message sets its timeline entry verb to `delete`.
   */
  router.delete('/activitystreams/:uuid/messages/:id',
    authorize.requiresAPILogin,
    requestMW.requireRouteParams('uuid'),
    asMiddleware.findStreamResource,
    requestMW.assertRequestElementNotNull('activity_stream'),
    messageMiddleware.load,
    messageMiddleware.canDelete,
    activitystreams.updateTimelineEntryVerb('delete'));

  /**
   * @swagger
   * /user/activitystreams :
   *   get:
   *     tags:
   *      - ActivityStreams
   *      - User
   *     description: Get all the activity streams of the collaborations the current user can access.
   *     parameters:
   *       - $ref: "#/parameters/as_domainid"
   *       - $ref: "#/parameters/as_writable"
   *       - $ref: "#/parameters/as_name"
   *       - $ref: "#/parameters/as_member"
   *     responses:
   *       200:
   *         $ref: "#/responses/as_user"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/user/activitystreams', authorize.requiresAPILogin, activitystreams.getMine);
};
