'use strict';

const passport = require('passport');

module.exports = function(router, dependencies) {
  const denormalizeUser = dependencies('denormalizeUser');
  const logger = dependencies('logger');

  logger.info('Initializing Facebook Token Auth routes');

  /**
   *
   * @swagger
   * /login-oauth/facebook/auth/token :
   *   post:
   *     tags:
   *      - Facebook Token Login
   *     description:
   *       Login into the application by issuing a POST
   *       The response will contain a cookie which you will be able to use in next request as long as the session is open.
   *     parameters:
   *       - $ref: "#/parameters/at_token"
   *     responses:
   *       200:
   *         $ref: "#/responses/lg_authentication"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/facebook/auth/token', passport.authenticate('facebook-token-login'), (req, res) => {
    denormalizeUser.denormalize(req.user).then(response => {
      res.status(200).json(response);
    });
  });
};
