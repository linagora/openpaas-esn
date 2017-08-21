'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies);

  var router = express.Router();
  /**
   * @swagger
   * /accounts:
   *   get:
   *     tags:
   *       - Accounts
   *     description: Gets the current user accounts
   *     parameters:
   *       - $ref: "#/parameters/account_type"
   *     responses:
   *       200:
   *         $ref: "#/responses/accounts_list"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/accounts', authorizationMW.requiresAPILogin, controller.getAccounts);

  /**
   * @swagger
   * /accounts/{id}:
   *   delete:
   *     tags:
   *       - Accounts
   *     description: Deletes account by id
   *     parameters:
   *       - $ref: "#/parameters/account_id"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/accounts/:id', authorizationMW.requiresAPILogin, controller.deleteAccount);

  return router;
};
