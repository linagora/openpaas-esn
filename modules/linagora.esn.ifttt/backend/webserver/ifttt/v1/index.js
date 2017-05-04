'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        ifttt = require('./controller')(dependencies),
        router = require('express').Router();

  router.get('/status', ifttt.status);
  router.get('/user/info', auth.requiresAPILoginAndFailWithError, ifttt.userInfo);
  router.post('/test/setup', ifttt.testSetup);

  router.use('/actions', require('./actions')(dependencies));
  router.use('/triggers', require('./triggers')(dependencies));

  router.use((err, req, res, next) => {
    if (res.statusCode === 401) {
      return res.json({ errors: [{ message: 'Unauthorized' }] });
    }

    next(err);
  });

  return router;
};
