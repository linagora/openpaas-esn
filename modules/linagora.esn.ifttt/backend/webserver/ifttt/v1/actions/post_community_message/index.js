'use strict';

module.exports = dependencies => {
  const router = require('express').Router(),
        controller = require('./controller')(dependencies);

  router.post('/', controller.postCommunityMessage);

  return router;
};
