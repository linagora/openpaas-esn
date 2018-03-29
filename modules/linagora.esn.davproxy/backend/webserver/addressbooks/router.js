'use strict';

const express = require('express');

module.exports = function(dependencies) {
  const router = express.Router();

  const authorizationMW = dependencies('authorizationMW');
  const proxyMW = require('../proxy/middleware')(dependencies);
  const davMiddleware = dependencies('davserver').davMiddleware;
  const controller = require('./controller')(dependencies);
  const middleware = require('./middleware')(dependencies);

  /**
   * @swagger
   * /addressbooks/{bookHome}.json:
   *   post:
   *     tags:
   *       - Davproxy
   *     description: Create an addressbook in the specified addressbook home
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_create"
   *     responses:
   *       201:
   *         $ref: "#/responses/davproxy_addressbook_create"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post(
    '/:bookHome.json',
    authorizationMW.requiresAPILogin,
    middleware.validateAddressbookCreation,
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.createAddressbook
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}.json:
   *   delete:
   *     tags:
   *       - Davproxy
   *     description: Remove an addressbook in the specified addressbook home
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete(
    '/:bookHome/:bookName.json',
    authorizationMW.requiresAPILogin,
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.removeAddressbook
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}.json:
   *   put:
   *     tags:
   *       - Davproxy
   *     description: Update an addressbook in the specified addressbook home
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_update"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put(
    '/:bookHome/:bookName.json',
    authorizationMW.requiresAPILogin,
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.updateAddressbook
  );

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
    proxyMW.generateNewToken,
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
    proxyMW.generateNewToken,
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
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.deleteContact
  );

  /**
   * @swagger
   * /addressbooks/{bookHome}/{bookName}/{contactId}.vcf:
   *   move:
   *     tags:
   *       - Davproxy
   *     description: Moves a contact
   *     parameters:
   *       - $ref: "#/parameters/davproxy_addressbook_book_home"
   *       - $ref: "#/parameters/davproxy_addressbook_book_name"
   *       - $ref: "#/parameters/davproxy_addressbook_contact_id"
   *       - $ref: "#/parameters/davproxy_addressbook_destination"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_201"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.move(
    '/:bookHome/:bookName/:contactId.vcf',
    authorizationMW.requiresAPILogin,
    middleware.requireDestinationInHeaders,
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.moveContact
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
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    controller.getContacts
  );

  router.propfind(
    '/:bookHome/:bookName.json',
    authorizationMW.requiresAPILogin,
    proxyMW.generateNewToken,
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
    proxyMW.generateNewToken,
    davMiddleware.getDavEndpoint,
    middleware.validateBookHome,
    middleware.validateBookNamesForSearch,
    controller.getAddressbooks
  );

  router.all('/*', authorizationMW.requiresAPILogin, proxyMW.generateNewToken, davMiddleware.getDavEndpoint, controller.defaultHandler);

  return router;
};
