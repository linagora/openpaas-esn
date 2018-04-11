'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var messages = require('../controllers/messages');
var pollMessages = require('../controllers/poll-messages');
var messageMiddleware = require('../middleware/message');
var asMiddleware = require('../middleware/activitystream');

module.exports = function(router) {

  /**
   * @swagger
   * /messages:
   *   get:
   *     tags:
   *      - Message
   *     description: List all the messages from the given message ids.
   *     parameters:
   *       - $ref: "#/parameters/msg_ids"
   *     responses:
   *       200:
   *         $ref: "#/responses/msg_list"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/messages', authorize.requiresAPILogin, messages.getMessages);

  /**
   * @swagger
   * /messages:
   *   post:
   *     tags:
   *      - Message
   *     description: Post a new message by the currently logged in user.
   *     parameters:
   *       - $ref: "#/parameters/msg_message"
   *     responses:
   *       201:
   *         $ref: "#/responses/msg_create"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/messages', authorize.requiresAPILogin, messageMiddleware.canReplyTo, asMiddleware.filterWritableTargets, messageMiddleware.checkTargets, messageMiddleware.checkMessageModel, messages.createOrReplyToMessage);

  /**
   * @swagger
   * /messages/{id}:
   *   get:
   *     tags:
   *      - Message
   *     description: Get a message from its ID.
   *     parameters:
   *       - $ref: "#/parameters/msg_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/msg_document"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/messages/:id', authorize.requiresAPILogin, messages.getMessage);

  /**
   * @swagger
   * /messages/{id}:
   *   delete:
   *     tags:
   *      - Message
   *     description: Delete a message from its ID.
   *     parameters:
   *       - $ref: "#/parameters/msg_id"
   *     responses:
   *       204:
   *         description:
   *           The message has been removed.
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/messages/:id', authorize.requiresAPILogin, messageMiddleware.load, messageMiddleware.canDelete, messages.deleteMessage);

  /**
   * @swagger
   * /messages/{id}/shares:
   *   post:
   *     tags:
   *      - Message
   *     description: |
   *       Copy a message from a resource (community, project, ...) to another (or several others)
   *
   *       i.e. share a message.
   *     parameters:
   *       - $ref: "#/parameters/msg_id"
   *       - $ref: "#/parameters/msg_share"
   *     responses:
   *       201:
   *         $ref: "#/responses/msg_create"
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
  router.post('/messages/:id/shares', authorize.requiresAPILogin, messageMiddleware.canShareFrom, messageMiddleware.canShareTo, messages.copy);

  /**
   * @swagger
   * /messages/email:
   *   post:
   *     tags:
   *      - Message
   *     description: Publish a message in rfc822 MIME form.
   *     consumes:
   *       - message/rfc822
   *     parameters:
   *       - $ref: "#/parameters/msg_id_query"
   *       - $ref: "#/parameters/msg_objectType"
   *       - $ref: "#/parameters/msg_mail"
   *     responses:
   *       201:
   *         $ref: "#/responses/msg_create"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/messages/email', authorize.requiresAPILogin, asMiddleware.isValidStream, messages.createMessageFromEmail);

  /**
   * @swagger
   * /messages/{id}/vote/{vote}:
   *   put:
   *     tags:
   *      - Message
   *     description:
   *       Vote for a choice within a poll message specified by the given id.
   *       Vote must refer to a correct index within the available choices.
   *       Each user can only vote one time.
   *     parameters:
   *       - $ref: "#/parameters/msg_id"
   *       - $ref: "#/parameters/msg_vote"
   *     responses:
   *       200:
   *         $ref: "#/responses/msg_vote"
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
  router.put('/messages/:id/vote/:vote', authorize.requiresAPILogin, requestMW.castParamToObjectId('id'), pollMessages.vote);
};
