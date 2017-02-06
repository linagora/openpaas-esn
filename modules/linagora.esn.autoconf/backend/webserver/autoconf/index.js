'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        autoconf = require('./controller')(dependencies),
        router = require('express').Router();

  /**
   * @swagger
   * /user:
   *   get:
   *     tags:
   *      - User
   *     description: Get the autoconfiguration file for the authenticated user
   *     security:
   *       - openpaas_auth : []
   *     responses:
   *       200:
   *         $ref: "#/responses/autoconf"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/api/user/autoconf', auth.requiresAPILogin, autoconf.generate);

  return router;
};
