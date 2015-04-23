'use strict';

var calendar;

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
      return res.json(400, { error: { code: 400, message: 'Event creation error', details: err.message }});
    } else if (!result) {
      return res.json(403, { error: { code: 403, message: 'Forbidden', details: 'You may not create the calendar event' }});
    }

    result = { _id: result._id, objectType: result.objectType };
    return res.json(req.body.type === 'created' ? 201 : 200, result);
  });
}

module.exports = function(dependencies) {
  calendar = require('./calendar.core')(dependencies);
  return {
    dispatchEvent: dispatchEvent
  };
};
