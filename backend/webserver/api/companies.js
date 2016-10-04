'use strict';

var companies = require('../controllers/companies');

module.exports = function(router) {
  /**
   * @swagger
   * /companies:
   *   get:
   *     tags:
   *      - Company
   *     description: Get companies list.
   *     parameters:
   *       - $ref: "#/parameters/cp_name"
   *     responses:
   *       200:
   *         $ref: "#/responses/cp_companies"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/companies', companies.search);
};
