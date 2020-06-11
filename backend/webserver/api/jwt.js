'use strict';

var authorize = require('../middleware/authorization');
var jwt = require('../controllers/authjwt');

module.exports = function(router) {

  /**
   * @swagger
   * /api/jwt/generate:
   *   post:
   *     tags:
   *       - JWT
   *     description: Generate a new JWT for the logged in user.
   *     responses:
   *       200:
   *         $ref: "#/responses/jw_generate"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/jwt/generate', authorize.requiresAPILogin, jwt.generateWebToken);
};
