'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var router = express.Router();
  var authorizationMW = dependencies('authorizationMW');
  var proxy = require('../proxy')(dependencies)('calendars');
  var davMiddleware = dependencies('davserver').davMiddleware;
  var controller = require('./controller')(dependencies);

  /*
   * OR-1472: We do not want this endpoint to be handled by the proxy because
   * bodyParser conflict with raw-body of express-http-proxy in the way that they both
   * are reading the same stream (req).
   */
  router.post('/:calendarid/events.json', authorizationMW.requiresAPILogin, davMiddleware.generateNewToken, davMiddleware.getDavEndpoint, controller.getEventsList);
  router.all('/*', authorizationMW.requiresAPILogin, davMiddleware.generateNewToken, davMiddleware.getDavEndpoint, proxy.handle({json: true}));

  return router;
};
