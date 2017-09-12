'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var logger = dependencies('logger');
  var controller = require('../controller')(dependencies);

  /**
   * @swagger
   * /facebook/connect:
   *   get:
   *     tags:
   *      - Oauth-Consumer
   *     description: Gets connect to facebook
   *     parameters:
   *       - $ref: '#/parameters/at_token'
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       401:
   *         $ref: '#/responses/cm_401'
   *       500:
   *         $ref: '#/responses/cm_500'
   */
  router.get('/facebook/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize('facebook-authz', {
      failureRedirect: '/#/controlcenter/accounts?status=error&provider=facebook&context=connect&action=redirect',
      callbackURL: '/oauth/facebook/connect/callback'
    })
  );

  /**
   * @swagger
   * /facebook/connect/callback:
   *   get:
   *     tags:
   *      - Oauth-Consumer
   *     description: Gets callback to facebook
   *     parameters:
   *       - $ref: '#/parameters/at_token'
   *       - $ref: '#/parameters/oauth.consumer_status'
   *     responses:
   *       200:
   *         $ref: '#/responses/cm_200'
   *       401:
   *         $ref: '#/responses/cm_401'
   *       500:
   *         $ref: '#/responses/cm_500'
   */
  router.get('/facebook/connect/callback',
    authorizationMW.requiresAPILogin,
    function(req, res, next) {
      passport.authorize('facebook-authz', function(err) {
        logger.debug('Facebook Passport error', err);
        next();
      })(req, res, next);
    },
    controller.finalizeWorkflow.bind(null, 'facebook')
  );

  router.use(controller.unknownAuthErrorMiddleware('facebook', new RegExp('Unknown authentication strategy "facebook-authz"')));
};
