'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies),
        router = require('express').Router();

  router.get('/android/guide', auth.requiresAPILogin, controller.renderAndroidGuide);

  return router;
};
