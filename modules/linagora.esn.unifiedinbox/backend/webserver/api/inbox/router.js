'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var sendEmail = require('./sendEmail')(dependencies);
  var router = express.Router();
  router.post('/api/inbox/sendemail', sendEmail.sendEmailToRecipients);

  return router;
};
