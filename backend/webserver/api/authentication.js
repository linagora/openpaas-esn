'use strict';

var authorize = require('../middleware/authorization');
var authentication = require('../controllers/authtoken');
var authTokenMiddleware = require('../middleware/token');

module.exports = function(router) {
  /**
   * @swagger
   * /api/authenticationtoken :
   *   get:
   *     tags:
   *      - Token
   *     description: Get a new authentication token for the current authenticated user.
   *     responses:
   *       200:
   *         $ref: "#/responses/at_token"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/authenticationtoken', authorize.requiresAPILogin, authentication.getNewToken);

  /**
   * @swagger
   * /api/authenticationtoken/{token} :
   *   get:
   *     tags:
   *      - Token
   *     description: Get the token content from the token ID if the token has not expired.
   *     parameters:
   *       - $ref: "#/parameters/at_token"
   *     responses:
   *       200:
   *         $ref: "#/responses/at_token_content"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/authenticationtoken/:token', authorize.requiresAPILogin, authTokenMiddleware.getToken, authentication.getToken);

  /**
   * @swagger
   * /authenticationtoken/{token}/user :
   *   get:
   *     tags:
   *      - Token
   *      - User
   *     description: |
   *       Get user information from an authentication token.
   *
   *       Also initiates a login session for the user behind the authentication token if one does not already exist.
   *     parameters:
   *       - $ref: "#/parameters/at_token"
   *     responses:
   *       200:
   *         $ref: "#/responses/at_token_user"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/authenticationtoken/:token/user', authTokenMiddleware.getToken, authentication.authenticateByToken);
};
