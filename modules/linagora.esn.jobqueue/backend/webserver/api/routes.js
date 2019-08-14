'use strict';

const express = require('express');

module.exports = (lib, dependencies) => {
  const authorizationMW = dependencies('authorizationMW');
  const platformAdminsMW = dependencies('platformAdminsMW');
  const router = express.Router();

  router.all('/*',
    authorizationMW.requiresAPILogin,
    platformAdminsMW.requirePlatformAdmin
  );
  router.get('/', (req, res) => res.redirect('/jobqueue/ui'));

  return router;
};
