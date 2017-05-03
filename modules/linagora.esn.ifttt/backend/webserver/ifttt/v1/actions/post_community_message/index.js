'use strict';

module.exports = dependencies => {
  const router = require('express').Router(),
        auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies);

  router.post('/', auth.requiresAPILogin, controller.postCommunityMessage);
  router.post('/fields/community/options', auth.requiresAPILogin, controller.getWritableCommunities);

  return router;
};
