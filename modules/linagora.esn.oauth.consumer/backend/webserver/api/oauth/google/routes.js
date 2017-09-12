'use strict';

var passport = require('passport');

module.exports = function(router, dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var logger = dependencies('logger');
  var controller = require('../controller')(dependencies);

  /**
   * @swagger
   * /google/connect:
   *   get:
   *     tags:
   *      - Oauth-Consumer
   *     description: Gets connect to google
   *     parameters:
   *       - $ref: '#/parameters/at_token'
   *     responses:
   *       200:
   *         $ref: '#/responses/cm_200'
   *       401:
   *         $ref: '#/responses/cm_401'
   *       500:
   *         $ref: '#/responses/cm_500'
   */
  router.get('/google/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize('google-authz', {
      accessType: 'offline',
      prompt: 'consent',
      scope: ['profile', 'https://www.google.com/m8/feeds'],
      failureRedirect: '/#/controlcenter/accounts?status=error&provider=google&context=connect&action=redirect',
      callbackURL: '/oauth/google/connect/callback'
    })
  );

  /**
   * @swagger
   * /google/connect/callback:
   *   get:
   *     tags:
   *      - Oauth-Consumer
   *     description: Gets callback to google
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
  router.get('/google/connect/callback',
    authorizationMW.requiresAPILogin,
    function(req, res, next) {
      passport.authorize('google-authz', function(err) {
        logger.debug('google Passport error', err);
        next();
      })(req, res, next);
    },
    controller.finalizeWorkflow.bind(null, 'google')
  );

  router.use(controller.unknownAuthErrorMiddleware('google', new RegExp('Unknown authentication strategy "google-authz"')));
};
