'use strict';

var calendar,
    arrayHelpers,
    logger;

function dispatchEvent(req, res) {
  if (!req.user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  if (!req.collaboration) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Collaboration id is missing'}});
  }

  if (!req.body.event_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Event id is missing'}});
  }

  calendar.dispatch({
    user: req.user,
    collaboration: req.collaboration,
    event: req.body
  }, function(err, result) {
    if (err) {
      logger.error('Event creation error', err);
      return res.json(500, { error: { code: 500, message: 'Event creation error', details: err.message }});
    } else if (!result) {
      return res.json(403, { error: { code: 403, message: 'Forbidden', details: 'You may not create the calendar event' }});
    }

    result = { _id: result._id, objectType: result.objectType };
    return res.json(req.body.type === 'created' ? 201 : 200, result);
  });
}

function inviteAttendees(req, res) {
  if (!req.user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  var emails = req.body.emails;
  if (!emails || arrayHelpers.isNullOrEmpty(emails)) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'The "emails" array is required and must contain at least one element'}});
  }

  var notify = req.body.notify || false;

  var method = req.body.method;
  if (!method || typeof method !== 'string') {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Method is required and must be a string (REQUEST, REPLY, CANCEL, etc.)'}});
  }

  var event = req.body.event;
  if (!event || typeof event !== 'string') {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Event is required and must be a string (ICS format)'}});
  }

  calendar.inviteAttendees(req.user, emails, notify, method, event, function(err, result) {
    if (err) {
      logger.error('Error when trying to send invite to attendees', err);
      return res.json(500, {error: {code: 500, message: 'Error when trying to send invite to attendees', details: err.message}});
    }
    return res.status(200).end();
  });
}

module.exports = function(dependencies) {
  logger = dependencies('logger');
  calendar = require('./core')(dependencies);
  arrayHelpers = dependencies('helpers').array;
  return {
    dispatchEvent: dispatchEvent,
    inviteAttendees: inviteAttendees
  };
};
