'use strict';

const express = require('express');

module.exports = function(dependencies) {
  const router = express.Router();

  const authorizationMW = dependencies('authorizationMW');
  const helperMW = dependencies('helperMW');
  const proxyMW = require('../proxy/middleware')(dependencies);
  const davMiddleware = dependencies('davserver').davMiddleware;
  const controller = require('./controller')(dependencies);

  /**
   * @swagger
   * /dav/api/addressbooks/{bookHome}.json/contacts:
   *   get:
   *     tags:
   *       - Davproxy
   *     description: Gets all contacts that match a searching pattern. <br>
   *       Query search is required, query bookName is optional. When bookName is set, it returns results belonging to this bookName only. <br>
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name_query"
   *       - $ref: "#/parameters/cm_search"
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_page"
   *     responses:
   *       200:
   *         $ref: "#/responses/davproxy_addressbook_contacts"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/:bookHome.json/contacts',
    authorizationMW.requiresAPILogin,
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    helperMW.requireInQuery('search', null),
    controller.searchContacts
  );

  router.all('/*', authorizationMW.requiresAPILogin, proxyMW.generateNewToken, davMiddleware.getDavEndpoint, controller.defaultHandler);

  return router;
};
