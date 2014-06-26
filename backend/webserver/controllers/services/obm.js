'use strict';

var obm = require('../../../core/obm');
var events = require('../../../core/obm/events');

function getId(req, res) {
  obm.getSessionId(req.user, function(err, sessionId) {
    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: err.message}});
    }
    return res.json(200, {sessionid: sessionId});
  });
}
module.exports.getId = getId;

function getEvents(req, res) {
  events.getEvents(req.user, function(err, result) {
    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: err.message}});
    }

    if (!result) {
      return res.send(200, []);
    }

    return res.json(200, result);
  });
}
module.exports.getEvents = getEvents;

function updateEvent(req, res) {
  console.log('Update event');

  var event = req.param('id');
  var state = req.param('state');

  if (!event || !state) {
    return res.send(400, { error: { status: 400, message: 'Bad Request', details: 'Event ID and state required'}});
  }

  events.setEventState(req.user, event, state, function(err, result) {
    if (err) {
      return res.send(500, { error: { status: 500, message: 'Server Error', details: err.message}});
    }
    return res.json(201);
  });
}
module.exports.updateEvent = updateEvent;
