'use strict';

module.exports = dependencies => {
  const router = require('express').Router(),
        auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies);

  router.post('/', auth.requiresAPILoginAndFailWithError, controller.postChatMessage);
  router.post('/fields/conversation/options', auth.requiresAPILoginAndFailWithError, controller.getWritableConversations);

  return router;
};
