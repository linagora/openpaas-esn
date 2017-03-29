'use strict';

var express = require('express');

module.exports = dependencies => {
  const controller = require('./controller')(dependencies);
  const calendarMW = require('./middleware')(dependencies);
  const authorizationMW = dependencies('authorizationMW');
  const collaborationMW = dependencies('collaborationMW');
  const davMiddleware = dependencies('davserver').davMiddleware;
  const tokenMW = dependencies('tokenMW');
  const router = express.Router();

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
