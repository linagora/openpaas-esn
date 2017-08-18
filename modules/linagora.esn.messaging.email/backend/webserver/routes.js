'use strict';

function routes(app, lib, dependencies) {

  var mw = require('./middleware')(dependencies, lib);
  var controllers = require('./controllers')(dependencies, lib);

  /**
   * @swagger
   * /messages/email/reply/check:
   *   get:
   *     tags:
   *       - Email
   *     description: Checks that the sender and the recipient are valid ie that the user can reply to the message.
   *     parameters:
   *       - $ref: "#/parameters/messaging.email_from"
   *       - $ref: "#/parameters/messaging.email_to"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  app.get('/api/messages/email/reply/check', mw.loadUser, mw.canReplyTo, function(req, res) {
    return res.status(200).end();
  });

  /**
   * @swagger
   * /messages/email/reply:
   *   post:
   *     tags:
   *       - Email
   *     description: Posts a new comment in reply to a message, by the currently logged in user. This is used by platform applications to reply to a message from an incoming email
   *     parameters:
   *       - $ref: "#/parameters/messaging.email_user"
   *       - $ref: "#/parameters/messaging.email_from"
   *       - $ref: "#/parameters/messaging.email_to"
   *       - $ref: "#/parameters/messaging.email_replyto"
   *     responses:
   *       201:
   *         $ref: "#/responses/messaging.email_reply"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  app.post('/api/messages/email/reply', mw.loadUser, mw.canReplyTo, controllers.replyMessageFromEmail);
}

module.exports = routes;
