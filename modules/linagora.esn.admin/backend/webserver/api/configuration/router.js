'use strict';

var express = require('express');

module.exports = function(dependencies) {
  var authorizationMW = dependencies('authorizationMW');
  var domainMiddleware = dependencies('domainMiddleware');
  var controller = require('./controller')(dependencies);

  var router = express.Router();

  /**
   * @swagger
   * /api/configuration/{uuid}:
   *   post:
   *     tags:
   *      - Configuration
   *     description: Get domain configurations.
   *     parameters:
   *       - $ref: "#/parameters/cf_uuid"
   *       - $ref: "#/parameters/cf_names"
   *     responses:
   *       200:
   *         $ref: "#/responses/cf_configs"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/api/configuration/:uuid',
    authorizationMW.requiresAPILogin,
    domainMiddleware.load,
    authorizationMW.requiresDomainManager,
    controller.getConfigurations);

  /**
   * @swagger
   * /api/configuration/{uuid}:
   *   put:
   *     tags:
   *      - Configuration
   *     description: Update domain configuration.
   *     parameters:
   *       - $ref: "#/parameters/cf_uuid"
   *       - $ref: "#/parameters/cf_configs"
   *     responses:
   *       200:
   *         $ref: "#/responses/cf_configs"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/api/configuration/:uuid',
    authorizationMW.requiresAPILogin,
    domainMiddleware.load,
    authorizationMW.requiresDomainManager,
    controller.updateConfigurations);

  return router;
};
