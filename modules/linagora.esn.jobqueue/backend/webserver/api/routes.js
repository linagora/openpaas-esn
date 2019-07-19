'use strict';

const express = require('express');

module.exports = (lib, dependencies) => {
  const authorizationMW = dependencies('authorizationMW');
  const platformAdminsMW = dependencies('platformAdminsMW');
  const router = express.Router();

  router.get('/', authorizationMW.requiresAPILogin, platformAdminsMW.requirePlatformAdmin, (req, res) => res.redirect('/jobqueue/ui'));

  return router;
};
