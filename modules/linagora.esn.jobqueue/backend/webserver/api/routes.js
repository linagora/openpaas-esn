'use strict';

const express = require('express');

module.exports = (lib, dependencies) => {
  const authorizationMW = dependencies('authorizationMW');
  const router = express.Router();

  router.get('/', authorizationMW.requiresAPILogin, (req, res) => res.redirect('/jobqueue/ui'));

  return router;
};
