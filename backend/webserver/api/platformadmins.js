const authorizationMw = require('../middleware/authorization');
const platformadminsMw = require('../middleware/platformadmins');
const helperMw = require('../middleware/helper');
const controller = require('../controllers/platformadmins');

module.exports = function(router) {

  /**
   * @swagger
   * /api/platformadmins:
   *   get:
   *     tags:
   *      - PlatformAdmin
   *     description: List all platform admins
   *     responses:
   *       200:
   *         $ref: "#/responses/sa_platformadmins"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/platformadmins',
    authorizationMw.requiresAPILogin,
    platformadminsMw.requirePlatformAdmin,
    controller.getAllPlatformAdmins);

  /**
   * @swagger
   * /api/platformadmins:
   *   post:
   *     tags:
   *      - PlatformAdmin
   *     description: Set a user as platform admin
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
  router.post('/platformadmins',
    authorizationMw.requiresAPILogin,
    platformadminsMw.requirePlatformAdmin,
    helperMw.requireBody,
    platformadminsMw.validateBodyData,
    controller.createPlatformAdmin);

  /**
   * @swagger
   * /api/platformadmins:
   *   delete:
   *     tags:
   *      - PlatformAdmin
   *     description: Unset a platform admin
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
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/platformadmins',
    authorizationMw.requiresAPILogin,
    platformadminsMw.requirePlatformAdmin,
    helperMw.requireBody,
    platformadminsMw.validateBodyData,
    controller.removePlatformAdmin);
};
