'use strict';

var invitation = require('../controllers/invitation');

module.exports = function(router) {

  /**
   * @swagger
   * /invitations/{uuid}:
   *   get:
   *     tags:
   *      - Invitation
   *     description: Get an invitation from its UUID.
   *     parameters:
   *       - $ref: "#/parameters/iv_uuid"
   *     responses:
   *       200:
   *         $ref: "#/responses/iv_get"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/invitations/:uuid', invitation.load, invitation.get);

  /**
   * @swagger
   * /invitations:
   *   post:
   *     tags:
   *      - Invitation
   *     description: Create an invitation.
   *     parameters:
   *       - $ref: "#/parameters/iv_content"
   *     responses:
   *       201:
   *         $ref: "#/responses/iv_create"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/invitations', invitation.create);

  /**
   * @swagger
   * /invitations/{uuid}:
   *   put:
   *     tags:
   *      - Invitation
   *     description: Finalize the invitation.
   *     parameters:
   *       - $ref: "#/parameters/iv_uuid"
   *       - $ref: "#/parameters/iv_content"
   *     responses:
   *       201:
   *         $ref: "#/responses/iv_create"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/invitations/:uuid', invitation.load, invitation.finalize);
};
