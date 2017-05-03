'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        ifttt = require('./controller')(dependencies),
        router = require('express').Router();

  router.get('/status', ifttt.status);
  router.get('/user/info', auth.requiresAPILogin, ifttt.userInfo);

  router.use('/actions', require('./actions')(dependencies));

  return router;
};
