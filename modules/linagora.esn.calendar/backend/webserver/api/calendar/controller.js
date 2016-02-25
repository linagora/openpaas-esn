'use strict';

var request = require('request');
var urljoin = require('url-join');
var ICAL = require('ical.js');
var jcalHelper = require('../../../lib/jcal/jcalHelper.js');
var calendar,
    arrayHelpers,
    logger,
    userModule;

var MAX_TRY_NUMBER = 12;

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

function changeParticipationSuccess(res, vcalendar, eventData) {
  var attendeeEmail = eventData.attendeeEmail;
  userModule.findByEmail(attendeeEmail, function(err, found) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Error while redirecting after participation change', details: err.message}});
    } else if (!found) {
      calendar.getBaseUrl(function(err, baseUrl) {
        if (err) {
          return res.status(500).json({error: {code: 500, message: 'Error while rendering event consultation page', details: err.message}});
        }
        calendar.generateActionLinks(baseUrl, eventData).then(function(links) {
          var eventJSON = JSON.stringify(vcalendar.toJSON());
          return res.status(200).render('../event-consultation-app/views/index', {eventJSON: eventJSON, attendeeEmail: attendeeEmail, links: links});
        });
      });
    } else {
      res.status(200).redirect('/#/calendar');
    }
  });
}

function tryUpdateParticipation(url, ESNToken, res, eventData, numTry) {
  numTry = numTry ? numTry + 1 : 1;
  if (numTry > MAX_TRY_NUMBER) {
    return res.status(500).json({error: {code: 500, message:'Exceeded max number of try for atomic update of event'}});
  }

  request({method: 'GET', url: url, headers: {ESNToken: ESNToken}}, function(err, response) {
    if (err || response.statusCode < 200 || response.statusCode >= 300) {
      return res.status(500).json({error: {code: 500, message: 'Error while modifying event', details: err ? err.message : response.body}});
    }
    var icalendar = new ICAL.parse(response.body);
    var vcalendar = new ICAL.Component(icalendar);
    var vevent = vcalendar.getFirstSubcomponent('vevent');

    var attendeeEmail = eventData.attendeeEmail;
    var action = eventData.action;
    var hasAttendee = jcalHelper.getAttendeesEmails(icalendar).indexOf(attendeeEmail) !== -1;
    if (!hasAttendee) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Attendee does not exist.'}});
    }
    var attendee = jcalHelper.getVeventAttendeeByMail(vevent, attendeeEmail);
    attendee.setParameter('partstat', action);
    request({method: 'PUT', headers: {ESNToken: ESNToken, 'If-Match': response.headers.etag}, body: vcalendar.toJSON(), url: url, json: true}, function(err, response) {
      if (!err && response.statusCode === 412) {
        tryUpdateParticipation(url, ESNToken, res, eventData, numTry);
      } else if (err || response.statusCode < 200 || response.statusCode >= 300) {
        res.status(500).json({error: {code: 500, message: 'Error while modifying event', details: err ? err.message : response.body}}).end();
      } else {
        changeParticipationSuccess(res, vcalendar, eventData);
      }
    });
  });
}

function changeParticipation(req, res) {
  var ESNToken = req.token && req.token.token ? req.token.token : '';
  var url = urljoin(req.davserver, 'calendars', req.user._id, req.eventPayload.calendarURI, req.eventPayload.uid + '.ics');

  tryUpdateParticipation(url, ESNToken, res, req.eventPayload);
}

module.exports = function(dependencies) {
  logger = dependencies('logger');
  calendar = require('./core')(dependencies);
  arrayHelpers = dependencies('helpers').array;
  userModule = dependencies('user');
  return {
    dispatchEvent: dispatchEvent,
    inviteAttendees: inviteAttendees,
    changeParticipation: changeParticipation
  };
};
