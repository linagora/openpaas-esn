'use strict';

var loginController = require('../controllers/login');
var loginRules = require('../middleware/login-rules');
var recaptcha = require('../middleware/verify-recaptcha');
var cookielifetime = require('../middleware/cookie-lifetime');

module.exports = function(router) {
  /**
   * @swagger
   * /api/login:
   *   post:
   *     tags:
   *      - Login
   *     description: |
   *       Login into the application by issuing a POST
   *
   *       The response will contain a cookie which you will be able to use in next request as long as the session is open.
   *     parameters:
   *       - $ref: "#/parameters/lg_credentials"
   *     responses:
   *       200:
   *         $ref: "#/responses/lg_authentication"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/login', loginRules.checkLoginCount, loginRules.checkDisabled, cookielifetime.set, recaptcha.verify, loginController.login);
};
