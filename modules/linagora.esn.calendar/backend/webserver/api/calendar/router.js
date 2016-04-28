'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var controller = require('./controller')(dependencies);
  var calendarMW = require('./middleware')(dependencies);
  var authorizationMW = dependencies('authorizationMW');
  var collaborationMW = dependencies('collaborationMW');
  var davMiddleware = dependencies('davserver').davMiddleware;
  var tokenMW = dependencies('tokenMW');

  var router = express.Router();

  router.post('/api/calendars/:objectType/:id/events',
    authorizationMW.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.requiresCollaborationMember,
    controller.dispatchEvent);

  router.post('/api/calendars/inviteattendees',
    authorizationMW.requiresAPILogin,
    controller.inviteAttendees);

  router.get('/api/calendars/event/participation',
    authorizationMW.requiresJWT,
    calendarMW.decodeJWT,
    tokenMW.generateNewToken(),
    davMiddleware.getDavEndpoint,
    controller.changeParticipation);

  router.get('/api/calendars/:calendarId/events.json',
    authorizationMW.requiresAPILogin,
    controller.searchEvents);

  return router;
};
