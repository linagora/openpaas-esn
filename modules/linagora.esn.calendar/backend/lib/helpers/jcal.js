'use strict';

var ICAL = require('ical.js');
var moment = require('moment-timezone');
var urljoin = require('url-join');

function _getEmail(attendee) {
  return attendee.getFirstValue().replace(/^MAILTO:/i, '');
}

function _icalDateToMoment(icalDate) {
  var dt;
  var momentDatetimeArg = [icalDate.year, icalDate.month - 1, icalDate.day, icalDate.hour, icalDate.minute, icalDate.second];

  if (icalDate.isDate) {
    dt = moment(momentDatetimeArg.slice(0, 3));
  } else if (icalDate.zone === ICAL.Timezone.utcTimezone) {
    dt = moment.utc(momentDatetimeArg);
  } else {
    dt = moment(momentDatetimeArg);
  }

  return dt;
}

function getVeventAttendeeByMail(vevent, email) {
  var results = vevent.getAllProperties('attendee').filter(function(attendee) {
    return _getEmail(attendee) === email;
  });

  return results.length ? results[0] : null;
}
module.exports.getVeventAttendeeByMail = getVeventAttendeeByMail;

function getVAlarmAsObject(valarm, dtstart) {
  var trigger = valarm.getFirstPropertyValue('trigger');
  var attendee = valarm.getFirstPropertyValue('attendee');
  var startDate = _icalDateToMoment(dtstart);
  var triggerDuration = moment.duration(trigger);
  return {
    action: valarm.getFirstPropertyValue('action'),
    trigger: trigger,
    description: valarm.getFirstPropertyValue('description'),
    summary: valarm.getFirstPropertyValue('summary'),
    attendee: attendee,
    email: attendee.replace(/^MAILTO:/i, ''),
    alarmDueDate: startDate.clone().add(triggerDuration),
    triggerDisplay: triggerDuration.humanize()
  };
}
module.exports.getVAlarmAsObject = getVAlarmAsObject;

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
      },
      alarm: {
        action: 'EMAIL',
        trigger: '-PT15M',
        description: 'an alarm',
        summary: 'Event Pending',
        attendee: 'aorganizer@linagora.com',
        email: 'aorganizer@linagora.com',
        alarmDueDate: 'a date 15 min before start date',
        triggerDisplay: '15 minutes'
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

  function getTimezoneOfIcalDate(icalDatetime) {
    if (icalDatetime.isDate) {
      return '';
    } else {
      return icalDatetime.zone === ICAL.Timezone.utcTimezone ? 'UTC' : icalDatetime.timezone;
    }
  }

  var allDay = vevent.getFirstProperty('dtstart').type === 'date';
  var dtstart = vevent.getFirstPropertyValue('dtstart');
  var startDate = _icalDateToMoment(dtstart);
  var startTimezone = getTimezoneOfIcalDate(dtstart);

  var end, endDate;
  var durationInDays = null;
  var dtend = vevent.getFirstPropertyValue('dtend');

  var period = ICAL.Period.fromData({
    start: dtstart,
    end: dtend || null,
    duration: vevent.getFirstPropertyValue('duration') || null
  });

  endDate = _icalDateToMoment(dtend || period.getEnd());
  var endTimezone = dtend ? getTimezoneOfIcalDate(dtend) : startTimezone;

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
      time: endDate.format('LT'),
      timezone: endTimezone
    };
  }

  var organizer = vevent.getFirstProperty('organizer');
  var cn = organizer.getParameter('cn');
  var mail = organizer.getFirstValue().replace(/^MAILTO:/i, '');
  organizer = {
    cn: cn,
    email: mail,
    avatar: urljoin(baseUrl, 'api/avatars?objectType=user&email=' + mail)
  };

  var content = {
    method: method,
    uid: vevent.getFirstPropertyValue('uid'),
    sequence: vevent.getFirstPropertyValue('sequence'),
    summary: vevent.getFirstPropertyValue('summary'),
    location: vevent.getFirstPropertyValue('location'),
    description: vevent.getFirstPropertyValue('description'),
    start: {
      date: startDate.format('L'),
      time: allDay ? undefined : startDate.format('LT'),
      timezone: startTimezone
    },
    end: end,
    allDay: allDay,
    attendees: attendees,
    organizer: organizer,
    durationInDays: durationInDays
  };

  var valarm = vevent.getFirstSubcomponent('valarm');
  if (valarm) {
    content.alarm = getVAlarmAsObject(valarm, dtstart);
  }

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
