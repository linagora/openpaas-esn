'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        ifttt = require('./controller')(dependencies),
        router = require('express').Router();

  router.get('/status', ifttt.status);
  router.get('/user/info', auth.requiresAPILogin, ifttt.userInfo);

  return router;
};
