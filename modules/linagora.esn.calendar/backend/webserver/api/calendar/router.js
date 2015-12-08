'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./controller')(dependencies);
  var authorizationMW = dependencies('authorizationMW');
  var collaborationMW = dependencies('collaborationMW');

  var router = express.Router();

  router.post('/api/calendars/:objectType/:id/events',
    authorizationMW.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.requiresCollaborationMember,
    controller.dispatchEvent);

  router.post('/api/calendars/inviteattendees',
    authorizationMW.requiresAPILogin,
    controller.inviteAttendees);

  router.put('/api/calendars/events', authorizationMW.requiresJWT, function(req, res) {
    res.send(200);
  });

  return router;
};
