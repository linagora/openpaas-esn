'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/user-status')(dependencies, lib);

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     tags:
   *       - Users-status
   *     description: Gets user status by user id
   *     parameters:
   *       - $ref: "#/parameters/user.status_user_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/user.status_user_status"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/users/:id',
    authorizationMW.requiresAPILogin,
    controller.getUserStatus);

  /**
   * @swagger
   * /users:
   *   post:
   *     tags:
   *       - Users-status
   *     description: Gets status of multiple users
   *     parameters:
   *       - $ref: "#/parameters/user.status_user_ids"
   *     responses:
   *       200:
   *         $ref: "#/responses/user.status_users_status"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/users',
    authorizationMW.requiresAPILogin,
    controller.getUsersStatus);

};
