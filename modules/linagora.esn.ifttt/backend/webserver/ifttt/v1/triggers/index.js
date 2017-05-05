'use strict';

module.exports = dependencies => {
  const router = require('express').Router();

  router.use('/new_event_with_hashtag', require('./new_event_with_hashtag')(dependencies));
  router.use('/new_chat_user_mention', require('./new_chat_user_mention')(dependencies));

  return router;
};
