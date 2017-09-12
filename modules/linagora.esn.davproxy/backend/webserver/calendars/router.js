'use strict';

var express = require('express');
var restreamer = require('connect-restreamer');

module.exports = function(dependencies) {

  var router = express.Router();
  var authorizationMW = dependencies('authorizationMW');
  var proxy = require('../proxy')(dependencies)('calendars');
  var middleware = require('../proxy/middleware')(dependencies);
  var davMiddleware = dependencies('davserver').davMiddleware;
  var controller = require('./controller')(dependencies);

  /*
   * OR-1472: We do not want this endpoint to be handled by the proxy because
   * bodyParser conflict with raw-body of express-http-proxy in the way that they both
   * are reading the same stream (req).
   */

  /**
   * @swagger
   * /calendar/{calendarid}/events.json:
   *   post:
   *     tags:
   *       - Davproxy
   *     description: Gets the list of events
   *     parameters:
   *       - $ref: "#/parameters/davproxy_calendar_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/davproxy_calendar_events"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/:calendarid/events.json', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, controller.getEventsList);
  /*
   * OR-1426: Same problem than the previous endpoint. We use restreamer here.
   * Restreamer breaks the stream and send the body as a whole so we don't use it
   * to get the list of every events.
   */
  router.all('/*', authorizationMW.requiresAPILogin, middleware.generateNewToken, davMiddleware.getDavEndpoint, restreamer(), middleware.removeContentLength, proxy.handle({json: true}));

  return router;
};
