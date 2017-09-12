'use strict';

const passport = require('passport');
const AUTH_NAME = 'github-authz';

module.exports = (router, dependencies) => {

  const authorizationMW = dependencies('authorizationMW');
  const logger = dependencies('logger');
  const controller = require('../controller')(dependencies);

  /**
   * @swagger
   * /github/connect:
   *   get:
   *     tags:
   *      - Oauth-Consumer
   *     description: Gets connect to github
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
  router.get('/github/connect',
    authorizationMW.requiresAPILogin,
    passport.authorize(AUTH_NAME, {
      failureRedirect: '/#/controlcenter/accounts?status=error&provider=github&context=connect&action=redirect',
      callbackURL: '/oauth/github/connect/callback'
    })
  );

  /**
   * @swagger
   * /github/connect/callback:
   *   get:
   *     tags:
   *      - Oauth-Consumer
   *     description: Gets callback to github
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
  router.get('/github/connect/callback', authorizationMW.requiresAPILogin, (req, res, next) => {
      passport.authorize(AUTH_NAME, err => {
        if (err) {
          logger.debug('Github Passport error', err);
        }
        next();
      })(req, res, next);
    },
    controller.finalizeWorkflow.bind(null, 'github')
  );

  router.use(controller.unknownAuthErrorMiddleware('github', new RegExp('Unknown authentication strategy "' + AUTH_NAME + '"')));
};
