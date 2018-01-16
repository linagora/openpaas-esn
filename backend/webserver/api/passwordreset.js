'use strict';

var passwordResetController = require('../controllers/passwordreset');
var usersMW = require('../middleware/users');
var authorizationMW = require('../middleware/authorization');
const passwordResetMW = require('../middleware/passwordreset');

module.exports = function(router) {

  /**
   * @swagger
   * /passwordreset:
   *   post:
   *     tags:
   *      - PasswordReset
   *     description: |
   *       Send a password reset request to a specified email if an attached user is found
   *     parameters:
   *       - $ref: "#/parameters/lg_passwordresetemail"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/passwordreset', passwordResetMW.isEnabled, usersMW.load, passwordResetController.sendPasswordReset);

  /**
   * @swagger
   * /passwordreset:
   *   put:
   *     tags:
   *      - PasswordReset
   *     description: |
   *       Set a new password for a user
   *       - $ref: "#/parameters/lg_passwordreset"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/passwordreset', passwordResetMW.isEnabled, authorizationMW.requiresJWT, authorizationMW.decodeJWTandLoadUser, passwordResetController.updateAndRemovePasswordReset);

  /**
   * @swagger
   * /passwordreset/changepassword:
   *   put:
   *     tags:
   *      - PasswordReset
   *     description: |
   *       Set a new password for a user
   *       - $ref: "#/parameters/lg_changepassword"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/passwordreset/changepassword', authorizationMW.requiresAPILogin, passwordResetController.changePassword);
};
