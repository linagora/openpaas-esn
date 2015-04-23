'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./calendar.controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');
  var collaborationMW = dependencies('collaborationMW');

  var router = express.Router();

  router.post('/api/calendars/:objectType/:id/events',
    authorizationMW.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.requiresCollaborationMember,
    controller.dispatchEvent);

  return router;
};
