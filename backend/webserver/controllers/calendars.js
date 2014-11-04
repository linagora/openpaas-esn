'use strict';

var calendar = require('../../core/calendar');

function createEvent(req, res) {
  var user = req.user;
  var community = req.community;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  var calendarId = req.params.id;
  if (!calendarId) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Calendar id is missing'}});
  }

  if (!req.body.event_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Event id is missing'}});
  }

  if (req.body.type !== 'created') {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Only type created is implemented'}});
  }

  var objectToDispatch = {
    user: user,
    community: community,
    event: req.body
  };

  calendar.dispatch(objectToDispatch, function(err, result) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Event dispatch error', details: err}});
    }
    if (!result) {
      return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'You can not create message'}});
    }
    if (result.type === 'created') {
      return res.json(201, {_id: result.saved._id});
    } else {
      return res.json(200, result);
    }
  });
}
module.exports.createEvent = createEvent;
