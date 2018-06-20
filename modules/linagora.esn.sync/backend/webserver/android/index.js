'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies),
        router = require('express').Router();

  /**
   * @swagger
   * /sync/android/guide:
   *   get:
   *     tags:
   *       - Sync
   *     description: Gets the guide for synchronization an Android device with OpenPaaS
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/android/guide', auth.requiresAPILogin, controller.renderAndroidGuide);

  return router;
};
