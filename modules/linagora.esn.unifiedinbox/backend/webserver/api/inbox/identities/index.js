'use strict';

const express = require('express');

module.exports = dependencies => {
  const router = express.Router(),
        auth = dependencies('authorizationMW');

  router.get('/identities/default', auth.requiresAPILogin, require('./controller')(dependencies).getDefaultIdentity);

  return router;
};
