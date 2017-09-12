'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var middleware = require('../proxy/middleware')(dependencies);
  var davMiddleware = dependencies('davserver').davMiddleware;
  var controller = require('./controller')(dependencies);

  /**
   * @swagger
   * /addressbooks/{bookHome}/{bookName}/{contactId}.vcf:
   *   get:
   *     tags:
   *       - Davproxy
   *     description: Gets contact of an user id
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_contact_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/davproxy_addressbook_update"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/:bookHome/:bookName/:contactId.vcf',
    authorizationMW.requiresAPILogin,
    middleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.getContact
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}/{bookName}/{contactId}.vcf:
   *   put:
   *     tags:
   *       - Davproxy
   *     description: Puts information to update contact
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_contact_id"
   *       - $ref: "#/parameters/davproxy_addressbook_contact"
   *     responses:
   *       200:
   *         $ref: "#/responses/davproxy_addressbook_update"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put(
    '/:bookHome/:bookName/:contactId.vcf',
    authorizationMW.requiresAPILogin,
    middleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.updateContact
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}/{bookName}/{contactId}.vcf:
   *   delete:
   *     tags:
   *       - Davproxy
   *     description: Deletes a contact in book
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_contact_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete(
    '/:bookHome/:bookName/:contactId.vcf',
    authorizationMW.requiresAPILogin,
    middleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.deleteContact
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}/{bookName}.json:
   *   get:
   *     tags:
   *       - Davproxy
   *     description: Gets all contacts in book name
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_contact_id"
   *       - $ref: "#/parameters/davproxy_addressbook_user_id"
   *       - $ref: "#/parameters/cm_search"
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_pages"
   *     responses:
   *       200:
   *         $ref: "#/responses/davproxy_addressbook_contact"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/:bookHome/:bookName.json',
    authorizationMW.requiresAPILogin,
    middleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.getContacts
  );

  router.propfind(
    '/:bookHome/:bookName.json',
    authorizationMW.requiresAPILogin,
    middleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.getAddressbook
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}.json:
   *   get:
   *     tags:
   *       - Davproxy
   *     description: Gets all address of books
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_user_id"
   *       - $ref: "#/parameters/cm_search"
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_pages"
   *     responses:
   *       200:
   *         $ref: "#/responses/davproxy_addressbook_address_books"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/:bookHome.json',
    authorizationMW.requiresAPILogin,
    middleware.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.getAddressbooks
  );

  router.all('/*', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.defaultHandler);

  return router;
};
