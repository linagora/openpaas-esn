'use strict';

const authorizationMW = require('../middleware/authorization');
const helperMW = require('../middleware/helper');
const configurationMW = require('../middleware/configuration');
const controller = require('../controllers/configurations');

module.exports = function(router) {

  /**
   * @swagger
   * /configurations:
   *   post:
   *     tags:
   *      - Configuration
   *     description: |
   *       Get user, domain, platform configurations
   *     parameters:
   *       - $ref: "#/parameters/cf_modules_scope"
   *       - $ref: "#/parameters/cf_modules_inspect"
   *       - $ref: "#/parameters/cf_modules_domain_id"
   *       - $ref: "#/parameters/cf_modules_with_keys"
   *     responses:
   *       200:
   *         $ref: "#/responses/cf_modules"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/configurations',
    authorizationMW.requiresAPILogin,
    helperMW.requireInQuery('scope'),
    configurationMW.qualifyScopeQueries,
    helperMW.requireBodyAsArray,
    configurationMW.ensureWellformedBody,
    configurationMW.checkAuthorizedRole,
    configurationMW.checkReadPermission,
    controller.getConfigurations);

  /**
   * @swagger
   * /configurations:
   *   put:
   *     tags:
   *      - Configuration
   *     description: |
   *       Set user, domain, platform configurations
   *     parameters:
   *       - $ref: "#/parameters/cf_modules_scope"
   *       - $ref: "#/parameters/cf_modules_domain_id"
   *       - $ref: "#/parameters/cf_modules"
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
  router.put('/configurations',
    authorizationMW.requiresAPILogin,
    helperMW.requireInQuery('scope'),
    configurationMW.qualifyScopeQueries,
    helperMW.requireBodyAsArray,
    configurationMW.ensureWellformedBody,
    configurationMW.validateWriteBody,
    configurationMW.checkAuthorizedRole,
    configurationMW.checkWritePermission,
    controller.updateConfigurations);
};
