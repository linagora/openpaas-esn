'use strict';

const passport = require('passport');

module.exports = function(router, dependencies) {
  const googleTokenMW = require('./../middlewares/google-token')(dependencies);
  const logger = dependencies('logger');
  const denormalizeUser = dependencies('denormalizeUser');

  logger.info('Initializing Google Token Auth routes');

  /**
   * @swagger
   * /login-oauth/google/auth/token :
   *   post:
   *     tags:
   *      - Google Token Login
   *     description:
   *       Login into the application by issuing a POST
   *
   *       The response will contain a cookie which you will be able to use in next request as long as the session is open.
   *     parameters:
   *       - $ref: '#/parameters/at_token'
   *     responses:
   *       200:
   *         $ref: '#/responses/lg_authentication'
   *       401:
   *         $ref: '#/responses/cm_401'
   *       500:
   *         $ref: '#/responses/cm_500'
   */
  router.post('/google/auth/token', googleTokenMW.getAccessToken, passport.authenticate('google-token-login'), (req, res) => {
    denormalizeUser.denormalize(req.user).then(response => {
      res.status(200).json(response);
    });
  });
};
