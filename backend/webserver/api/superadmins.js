const authorizationMw = require('../middleware/authorization');
const superadminsMw = require('../middleware/superadmins');
const helperMw = require('../middleware/helper');
const controller = require('../controllers/superadmins');

module.exports = function(router) {

  /**
   * @swagger
   * /superadmins/init:
   *   post:
   *     tags:
   *      - Superadmin
   *     description: Initialize the first superadmin
   *     parameters:
   *       - $ref: "#/parameters/sa_set_type"
   *       - $ref: "#/parameters/sa_set_data"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/superadmins/init',
    superadminsMw.canCreateFirstSuperAdmin,
    controller.createSuperAdmin);

  /**
   * @swagger
   * /superadmins:
   *   get:
   *     tags:
   *      - Superadmin
   *     description: List all superadmins
   *     responses:
   *       200:
   *         $ref: "#/responses/sa_superadmins"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/superadmins',
    authorizationMw.requiresAPILogin,
    superadminsMw.requireSuperAdmin,
    controller.getAllSuperAdmins);

  /**
   * @swagger
   * /superadmins:
   *   post:
   *     tags:
   *      - Superadmin
   *     description: Set a user as superadmin
   *     parameters:
   *       - $ref: "#/parameters/sa_set_type"
   *       - $ref: "#/parameters/sa_set_data"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
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
  router.post('/superadmins',
    authorizationMw.requiresAPILogin,
    superadminsMw.requireSuperAdmin,
    helperMw.requireBody,
    controller.createSuperAdmin);

  /**
   * @swagger
   * /superadmins:
   *   delete:
   *     tags:
   *      - Superadmin
   *     description: Unset a superadmin
   *     parameters:
   *       - $ref: "#/parameters/sa_unset_type"
   *       - $ref: "#/parameters/sa_unset_data"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
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
  router.delete('/superadmins',
    authorizationMw.requiresAPILogin,
    superadminsMw.requireSuperAdmin,
    controller.removeSuperAdmin);
};
