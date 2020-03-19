'use strict';

const express = require('express');

module.exports = dependencies => {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('./controller')(dependencies);

  const router = express.Router();

  /**
   * @swagger
   * /account/api/accounts:
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
   * /account/api/accounts/{id}:
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

  /**
   * @swagger
   * /account/api/accounts/providers:
   *   get:
   *     tags:
   *       - Accounts
   *     description: Get available social account providers from OAuth configuration
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/accounts/providers', authorizationMW.requiresAPILogin, controller.getAccountProviders);

  return router;
};
