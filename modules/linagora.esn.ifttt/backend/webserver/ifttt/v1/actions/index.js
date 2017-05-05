'use strict';

module.exports = dependencies => {
  const router = require('express').Router();

  router.use('/post_community_message', require('./post_community_message')(dependencies));
  router.use('/post_chat_message', require('./post_chat_message')(dependencies));

  return router;
};
