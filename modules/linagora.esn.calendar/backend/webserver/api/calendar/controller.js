'use strict';

var request = require('request');
var urlBuilder = require('url');
var ICAL = require('ical.js');
var jcalHelper = require('../../../lib/jcal/jcalHelper.js');
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
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  var emails = req.body.emails;
  if (!emails || arrayHelpers.isNullOrEmpty(emails)) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'The "emails" array is required and must contain at least one element'}});
  }

  var notify = req.body.notify || false;

  var method = req.body.method;
  if (!method || typeof method !== 'string') {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Method is required and must be a string (REQUEST, REPLY, CANCEL, etc.)'}});
  }

  var event = req.body.event;
  if (!event || typeof event !== 'string') {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Event is required and must be a string (ICS format)'}});
  }

  var calendarURI = req.body.calendarURI;
  if (!calendarURI || typeof calendarURI !== 'string') {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Calendar Id is required and must be a string'}});
  }

  calendar.inviteAttendees(req.user, emails, notify, method, event, calendarURI, function(err) {
    if (err) {
      logger.error('Error when trying to send invitations to attendees', err);
      return res.status(500).json({error: {code: 500, message: 'Error when trying to send invitations to attendees', details: err.message}});
    }
    return res.status(200).end();
  });
}

function changeParticipation(req, res) {
  var ESNToken = req.token && req.token.token ? req.token.token : '';
  var icalendar = ICAL.parse(req.eventPayload.event);
  var vcalendar = new ICAL.Component(icalendar);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  var hasAttendee = jcalHelper.getAttendeesEmails(icalendar).indexOf(req.eventPayload.attendeeEmail) !== -1;
  if (!hasAttendee) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Attendee does not exist.'}});
  }
  var attendee = jcalHelper.getVeventAttendeeByMail(vevent, req.eventPayload.attendeeEmail);
  attendee.setParameter('partstat', req.eventPayload.action);

  var url = urlBuilder.resolve(req.davserver, ['calendars', req.user._id, req.eventPayload.calendarURI, vevent.getFirstPropertyValue('uid') + '.ics'].join('/'));
  request({method: 'PUT', headers: {ESNToken: ESNToken}, body: vcalendar.toJSON(), url: url, json: true}, function(err, response) {
    if (err || response.statusCode < 200 || response.statusCode >= 300) {
      return res.status(500).json({error: {code: 500, message: 'Error while modifying event', details: err ? err.message : response.body}});
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
    inviteAttendees: inviteAttendees,
    changeParticipation: changeParticipation
  };
};
