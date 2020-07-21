'use strict';

var express = require('express');

module.exports = function(dependencies, lib) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies, lib);
  var importerMiddleware = require('./middleware')(dependencies, lib);

  /**
   * @swagger
   * /import/api/{type}:
   *   post:
   *     tags:
   *       - Import
   *     description: Imports contacts from a specified type into OpenPaaS ESN.
   *     parameters:
   *       - $ref: "#/parameters/contact.import_type"
   *       - $ref: "#/parameters/contact.import_account_id"
   *     responses:
   *       202:
   *         $ref: "#/responses/cm_202"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.post('/:type', authorizationMW.requiresAPILogin, importerMiddleware.checkRequiredBody, importerMiddleware.getAccount, controller.importContacts);

  return router;
};
