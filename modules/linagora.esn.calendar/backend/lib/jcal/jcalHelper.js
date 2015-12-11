'use strict';

var ICAL = require('ical.js');
var moment = require('moment');
var url = require('url');

function _getEmail(attendee) {
  return attendee.getFirstValue().replace(/^MAILTO:/i, '');
}

/**
 * Return a formatted, easily usable data for an email template from a jcal object
 * @param {String} icalendar Representation of a icalendar object as a string.
 * @return {Object} content
 * {
      method: 'REQUEST',
      sequence: 0,
      summary: 'aSummary',
      start: {
        date: '06/12/2015',
        time: '3:00 PM'
      },
      end: {
        date: '06/12/2015',
        time: '3:30 PM'
      },
      allday: true,
      location: 'aLocation',
      description: 'aDescription',
      organizer: {
        cn: 'aOrganizer',
        email: 'aorganizer@linagora.com',
        avatar: 'http://localhost:8080/api/avatars?objectType=user&email=aorganizer@linagora.com'
      },
      attendees: {
        'aattendee@linagora.com>: {
          cn: 'aattendee',
          partstat: 'ACCEPTED',
        },
        'aattendee2@linagora.com>: {
          cn: 'aattendee2',
          partstat: 'NEEDS-ACTION',
        }
      }
   }
 */
function jcal2content(icalendar, baseUrl) {
  var vcalendar = ICAL.Component.fromString(icalendar);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  var method = vcalendar.getFirstPropertyValue('method');

  var attendees = {};
  vevent.getAllProperties('attendee').forEach(function(attendee) {
    var partstat = attendee.getParameter('partstat');
    var cn = attendee.getParameter('cn');
    var mail = _getEmail(attendee);
    attendees[mail] = {
      partstat: partstat,
      cn: cn
    };
  });

  var allDay = vevent.getFirstProperty('dtstart').type === 'date';
  var startDate = moment(vevent.getFirstPropertyValue('dtstart').toJSDate());
  var end, endDate;
  var durationInDays = null;
  if (method === 'CANCEL') {
    end = null;
  } else {
    var period = ICAL.Period.fromData({
      start: vevent.getFirstPropertyValue('dtstart'),
      end: vevent.getFirstPropertyValue('dtend') || null,
      duration: vevent.getFirstPropertyValue('duration') || null
    });
    endDate = moment(period.getEnd().toJSDate());
    if (!!endDate && !!startDate) {
      durationInDays = endDate.diff(startDate, 'days');
    }
    // OR-1221: end is exclusive when the event is an allday event.
    // For end user, we are chosing an inclusive end date
    if (allDay) {
      endDate.subtract(1, 'day');
      end = {
        date: endDate.format('L')
      };
    } else {
      end = {
        date: endDate.format('L'),
        time: endDate.format('LT')
      };
    }
  }
  var organizer = vevent.getFirstProperty('organizer');
  var cn = organizer.getParameter('cn');
  var mail = organizer.getFirstValue().replace(/^MAILTO:/i, '');
  organizer = {
    cn: cn,
    email: mail,
    avatar: url.resolve(baseUrl, 'api/avatars?objectType=user&email=' + mail)
  };

  var content = {
    method: method,
    sequence: vevent.getFirstPropertyValue('sequence'),
    summary: vevent.getFirstPropertyValue('summary'),
    location: vevent.getFirstPropertyValue('location'),
    description: vevent.getFirstPropertyValue('description'),
    start: {
      date: startDate.format('L'),
      time: allDay ? undefined : startDate.format('LT')
    },
    end: end,
    allDay: allDay,
    attendees: attendees,
    organizer: organizer,
    durationInDays: durationInDays
  };

  return content;
}
module.exports.jcal2content = jcal2content;

function getAttendeesEmails(icalendar) {
  var vcalendar = new ICAL.Component(icalendar);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  return vevent.getAllProperties('attendee').map(function(attendee) {
    return _getEmail(attendee);
  });
}
module.exports.getAttendeesEmails = getAttendeesEmails;

function getOrganizerEmail(icalendar) {
  var vcalendar = new ICAL.Component(icalendar);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  var organizer = vevent.getFirstProperty('organizer');
  if (organizer) {
    return organizer.getFirstValue().replace(/^MAILTO:/i, '');
  }
}
module.exports.getOrganizerEmail = getOrganizerEmail;
