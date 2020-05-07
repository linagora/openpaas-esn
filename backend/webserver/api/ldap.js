'use strict';

var authorize = require('../middleware/authorization');
var ldap = require('../controllers/ldap');

module.exports = function(router) {

  /**
   * @swagger
   * /api/ldap/search:
   *   get:
   *     tags:
   *       - LDAP
   *     description: Search ldap's users.
   *     parameters:
   *       - $ref: "#/parameters/ldap_limit"
   *       - $ref: "#/parameters/ldap_search"
   *     responses:
   *       200:
   *         $ref: "#/responses/ldap_uss_content"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/ldap/search', authorize.requiresAPILogin, ldap.search);
};
