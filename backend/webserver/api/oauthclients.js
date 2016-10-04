'use strict';

var authorize = require('../middleware/authorization');
var oauthclients = require('../controllers/oauthclients');

module.exports = function(router) {

  /**
   * @swagger
   * /oauth/clients:
   *   get:
   *     tags:
   *      - Oauth Client
   *     description: List all the oauth applications registered
   *     responses:
   *       200:
   *         $ref: "#/responses/oauth_list"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/oauth/clients', authorize.requiresAPILogin, oauthclients.list);

  /**
   * @swagger
   * /oauth/clients:
   *   post:
   *     tags:
   *      - Oauth Client
   *     description: Post a new oauth application
   *     parameters:
   *       - $ref: "#/parameters/oauth_application"
   *     responses:
   *       201:
   *         $ref: "#/responses/oauth_create"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/oauth/clients', authorize.requiresAPILogin, oauthclients.create);

  /**
   * @swagger
   * /oauth/clients/{id}:
   *   get:
   *     tags:
   *      - Oauth Client
   *     description: Get the Oauth client with the given id
   *     parameters:
   *       - $ref: "#/parameters/oauth_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/oauth_document"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/oauth/clients/:id', authorize.requiresAPILogin, oauthclients.get);

  /**
   * @swagger
   * /oauth/clients/{id}:
   *   delete:
   *     tags:
   *       - Oauth Client
   *     description: Delete a given oauth client application
   *     parameters:
   *       - $ref: "#/parameters/oauth_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/oauth_document"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/oauth/clients/:id', authorize.requiresAPILogin, oauthclients.remove);
};
