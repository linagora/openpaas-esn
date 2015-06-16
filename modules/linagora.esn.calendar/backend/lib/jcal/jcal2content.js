'use strict';

var icaljs = require('ical.js');
var moment = require('moment');

function _getDisplayName(attendee) {
  var cn = attendee.getParameter('cn');
  var mail = attendee.getFirstValue().replace(/^MAILTO:/, '');
  return cn ? cn + ' <' + mail + '>' : mail;
}

/**
 * Return a formatted, easily usable data for an email template from a jcal object
 * @param {String} icalendar Representation of a icalendar object as a string.
 * @return {Object} content
 * {
      summary: 'aSummary',
      start: 'Fri, Jun 12, 2015 3:00 PM',
      end: 'Fri, Jun 12, 2015 3:30 PM',
      location: 'aLocation',
      description: 'aDescription',
      organizer: 'aOrganizer <aorganizer@linagora.com>',
      attendees: {
        'aattendee <aattendee@linagora.com>': 'ACCEPTED',
        'aattendee2 <aattendee2@linagora.com>': 'NEEDS-ACTION'
      }
   }
 */
function jcal2content(icalendar) {
  var vcalendar = icaljs.Component.fromString(icalendar);
  var vevent = vcalendar.getFirstSubcomponent('vevent');

  var attendees = {};
  vevent.getAllProperties('attendee').forEach(function(attendee) {
    var partstat = attendee.getParameter('partstat');
    attendees[_getDisplayName(attendee)] = partstat;
  });

  var period = icaljs.Period.fromData({
    start: vevent.getFirstPropertyValue('dtstart'),
    end: vevent.getFirstPropertyValue('dtend') || null,
    duration: vevent.getFirstPropertyValue('duration') || null
  });

  var organizer = vevent.getFirstProperty('organizer');
  organizer = _getDisplayName(organizer);

  var content = {
    summary: vevent.getFirstPropertyValue('summary'),
    location: vevent.getFirstPropertyValue('location'),
    description: vevent.getFirstPropertyValue('description'),
    start: moment(vevent.getFirstPropertyValue('dtstart').toJSDate()).format('llll'),
    end: moment(period.getEnd().toJSDate()).format('llll'),
    attendees: attendees,
    organizer: organizer
  };

  return content;
}

module.exports = jcal2content;
