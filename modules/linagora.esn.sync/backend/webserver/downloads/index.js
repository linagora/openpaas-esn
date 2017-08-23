'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies),
        router = require('express').Router();

  /**
   * @swagger
   * /sync/downloads/thunderbird/op-tb-autoconf.xpi:
   *   get:
   *     tags:
   *       - Sync
   *     description: Downloads ThunderBird extension autoconfig file.
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/downloads/thunderbird/op-tb-autoconf.xpi', auth.requiresAPILogin, controller.downloadTBExtension);

  return router;
};
