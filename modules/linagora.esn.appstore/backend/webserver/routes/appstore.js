'use strict';

var express = require('express');
var cors = require('cors');

module.exports = function(appstoremanager, dependencies) {

  var appstoreAsController = require('../controllers/appstore')(appstoremanager);
  var appstoreAsMiddleware = require('../middleware/appstore')(appstoremanager);
  var authorizationMW = dependencies('authorizationMW');

  var router = express.Router();

  router.all('/api/*', cors(), authorizationMW.requiresAPILogin);
  router.all('/api/apps/:id', appstoreAsMiddleware.load);
  router.all('/api/apps/:id/*', appstoreAsMiddleware.load);

  /**
   * @swagger
   * /apps:
   *   get:
   *     tags:
   *       - AppStore
   *     description: Gets the list of all applications.
   *     responses:
   *       200:
   *         $ref: "#/responses/appstore_apps"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/api/apps', appstoreAsController.list);

  /**
   * @swagger
   * /apps/{id}:
   *   get:
   *     tags:
   *       - AppStore
   *     description: Gets details of an application
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/appstore_app"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/api/apps/:id', appstoreAsController.get);

  /**
   * @swagger
   * /apps:
   *   post:
   *     tags:
   *       - AppStore
   *     description: Creates a new application.
   *     parameters:
   *       - $ref: "#/parameters/appstore_application"
   *     responses:
   *       200:
   *         $ref: "#/responses/appstore_created_app"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/api/apps', appstoreAsController.submit);

  /**
   * @swagger
   * /apps/{id}:
   *   delete:
   *     tags:
   *       - AppStore
   *     description: Removes an application from the app store, it will also delete every files (avatar, artifacts) related to this application.
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *     responses:
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/api/apps/:id', appstoreAsController.deleteApp);

  /**
   * @swagger
   * /apps/{id}/deploy:
   *   put:
   *     tags:
   *       - AppStore
   *     description: Deploys a new application to a specified target with a specified version.
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_target"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/api/apps/:id/deploy', appstoreAsController.deploy);

  /**
   * @swagger
   * /apps/{id}/updeploy:
   *   put:
   *     tags:
   *       - AppStore
   *     description: Deploys a new version of the application
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *     responses:
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/api/apps/:id/updeploy', appstoreAsController.updeploy);

  /**
   * @swagger
   * /apps/{id}/undeploy:
   *   put:
   *     tags:
   *       - AppStore
   *     description: Undeploys an application of a specified target described in the request body.
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_target"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/api/apps/:id/undeploy', appstoreAsController.undeploy);

  /**
   * @swagger
   * /apps/{id}/avatar:
   *   get:
   *     tags:
   *       - Avatar
   *     description: Gets the application avatar as image
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_format"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       304:
   *         $ref: "#/responses/cm_304"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/api/apps/:id/avatar', appstoreAsController.getAvatar);

  /**
   * @swagger
   * /apps/{id}/avatar:
   *   post:
   *     tags:
   *       - Avatar
   *     description: Uploads an avatar for the application
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_mime_type"
   *       - $ref: "#/parameters/appstore_size"
   *     responses:
   *       201:
   *         $ref: "#/responses/appstore_created_avatar"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       412:
   *         $ref: "#/responses/cm_412"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/api/apps/:id/avatar', appstoreAsController.uploadAvatar);

  /**
   * @swagger
   * /apps/{id}/artifact/{artifactId}:
   *   get:
   *     tags:
   *       - AppStore
   *     description: Gets the application artifact related to artifactId
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_artifact_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/api/apps/:id/artifact/:artifactId', appstoreAsController.getArtifact);

  /**
   * @swagger
   * /apps/{id}/artifact:
   *   post:
   *     tags:
   *       - AppStore
   *     description: Uploads a new application artifact
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_size"
   *       - $ref: "#/parameters/appstore_mime_type"
   *       - $ref: "#/parameters/appstore_version"
   *     responses:
   *       201:
   *         $ref: "#/responses/appstore_created_avatar"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/api/apps/:id/artifact', appstoreAsController.uploadArtifact);

  /**
   * @swagger
   * /apps/{id}/install:
   *   put:
   *     tags:
   *       - AppStore
   *     description: Installs an application of a specific target.
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_object_type"
   *     responses:
   *       205:
   *         $ref: "#/responses/cm_205"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       403:
   *         $ref: "#/responses/cm_500"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/api/apps/:id/install', appstoreAsController.install);

  /**
   * @swagger
   * /apps/{id}/uninstall:
   *   put:
   *     tags:
   *       - AppStore
   *     description: Uninstalls an application of a specific target.
   *     parameters:
   *       - $ref: "#/parameters/appstore_app_id"
   *       - $ref: "#/parameters/appstore_object_type"
   *     responses:
   *       205:
   *         $ref: "#/responses/cm_205"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       403:
   *         $ref: "#/responses/cm_500"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/api/apps/:id/uninstall', appstoreAsController.uninstall);

  return router;
};
