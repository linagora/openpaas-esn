'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');

  var router = express.Router();

  /**
   * @swagger
   * /info:
   *   get:
   *     tags:
   *       - DavServer
   *     description: Gets the CalDAV server informations.
   *     responses:
   *       200:
   *         $ref: "#/responses/davserver_url"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/api/info', authorizationMW.requiresAPILogin, controller.getDavUrl);

  return router;
};
