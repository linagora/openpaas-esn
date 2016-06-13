'use strict';

var locale = require('../controllers/locale');

module.exports = function(router) {

  /**
   * @swagger
   * /locales:
   *   get:
   *     tags:
   *       - Locale
   *     description: Get the list of available locales.
   *     responses:
   *       200:
   *         $ref: "#/responses/lo_list"
   */
  router.get('/locales', locale.getAll);

  /**
   * @swagger
   * /locales/current:
   *   get:
   *     tags:
   *       - Locale
   *     description: Get the current locale data.
   *     responses:
   *       200:
   *         $ref: "#/responses/lo_current"
   */
  router.get('/locales/current', locale.get);

  /**
   * @swagger
   * /locales/{locale}:
   *   get:
   *     tags:
   *       - Locale
   *     description: Get the locale data.
   *     parameters:
   *       - $ref: "#/parameters/lo_name"
   *     responses:
   *       200:
   *         $ref: "#/responses/lo_locale"
   */
  router.get('/locales/:locale', locale.set);
};
