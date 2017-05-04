'use strict';

module.exports = dependencies => {
  const router = require('express').Router(),
        auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies);

  router.post('/', auth.requiresAPILoginAndFailWithError, controller.newEventWithHashtag);

  return router;
};
