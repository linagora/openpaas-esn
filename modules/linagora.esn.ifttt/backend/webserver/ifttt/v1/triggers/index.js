'use strict';

module.exports = dependencies => {
  const router = require('express').Router();

  router.use('/new_event_with_hashtag', require('./new_event_with_hashtag')(dependencies));

  return router;
};
