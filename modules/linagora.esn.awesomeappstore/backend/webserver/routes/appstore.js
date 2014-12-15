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

  // TODO : installed and update boolean, X-Esn-Item-Count
  router.get('/api/apps', appstoreAsController.list);
  router.get('/api/apps/:id', appstoreAsController.get);
  router.post('/api/apps', appstoreAsController.submit);
  router.delete('/api/apps/:id', appstoreAsController.deleteApp);

  router.put('/api/apps/:id/deploy', appstoreAsController.deploy);
  // TODO updeploy is not coded yet
  router.put('/api/apps/:id/updeploy', appstoreAsController.updeploy);
  router.put('/api/apps/:id/undeploy', appstoreAsController.undeploy);

  router.get('/api/apps/:id/avatar', appstoreAsController.getAvatar);
  router.post('/api/apps/:id/avatar', appstoreAsController.uploadAvatar);

  router.get('/api/apps/:id/artifact/:artifactId', appstoreAsController.getArtifact);
  router.post('/api/apps/:id/artifact', appstoreAsController.uploadArtifact);

  router.put('/api/apps/:id/install', appstoreAsController.install);
  router.put('/api/apps/:id/uninstall', appstoreAsController.uninstall);

  return router;
};
