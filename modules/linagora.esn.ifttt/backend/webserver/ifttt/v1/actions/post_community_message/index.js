'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        router = require('express').Router(),
        controller = require('./controller')(dependencies);

  router.post('/', controller.postCommunityMessage);
  router.post('/fields/community/options', auth.requiresAPILogin, controller.getWritableCommunities);

  return router;
};
