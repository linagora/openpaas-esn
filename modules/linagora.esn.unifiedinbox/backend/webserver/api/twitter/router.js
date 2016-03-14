'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();
  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies);
  var twitterMiddleware = require('./middleware')(dependencies);

  router.get('/api/inbox/tweets', authorizationMW.requiresAPILogin, twitterMiddleware.checkRequiredBody, twitterMiddleware.getAccount, controller.getTweets);

  return router;
};
