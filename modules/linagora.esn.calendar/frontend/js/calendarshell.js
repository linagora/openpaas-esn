'use strict';

angular.module('esn.calendar')

  .factory('CalendarShell', function(ICAL, FCMoment, uuid4, jstz, calendarUtils, ICAL_PROPERTIES) {
    var timezoneLocal = this.timezoneLocal || jstz.determine().name();
    /**
     * A shell that wraps an ical.js VEVENT component to be compatible with
     * fullcalendar's objects.
     * @param {ICAL.Component} vcalendar     The ical.js VCALENDAR component.
     * @param {Object} extendedProperties    Object of additional properties like:
     *   {
     *     path: {String},                   The path on the caldav server.
     *     etag: {String},                   The ETag of the event.
     *     gracePeriodTaskId: {String}       The gracePeriodTaskId of the event.
     *   }
     */
    function CalendarShell(vcomponent, extendedProperties) {
      var vcalendar, vevent;
      if (vcomponent.name === 'vcalendar') {
        vevent = vcomponent.getFirstSubcomponent('vevent');
        vcalendar = vcomponent;
      } else if (vcomponent.name === 'vevent') {
        vevent = vcomponent;
        vcalendar = vevent.parent;
      }

      this.uid = vevent.getFirstPropertyValue('uid');
      this.title = vevent.getFirstPropertyValue('summary');
      this.location = vevent.getFirstPropertyValue('location');
      this.description = vevent.getFirstPropertyValue('description');
      this.allDay = vevent.getFirstProperty('dtstart').type === 'date';
      this.isInstance = !!vevent.getFirstProperty('recurrence-id');
      this.start = FCMoment(vevent.getFirstPropertyValue('dtstart').toJSDate());
      this.end = FCMoment(vevent.getFirstPropertyValue('dtend').toJSDate());
      this.formattedDate = this.start.format('MMMM D, YYYY');
      this.formattedStartTime = this.start.format('h');
      this.formattedStartA = this.start.format('a');
      this.formattedEndTime = this.end.format('h');
      this.formattedEndA = this.end.format('a');

      var status = vevent.getFirstPropertyValue('status');
      if (status) {
        this.status = status;
      }

      var recId = vevent.getFirstPropertyValue('recurrence-id');
      this.isInstance = !!recId;
      this.id = recId ? this.uid + '_' + recId.convertToZone(ICAL.Timezone.utcTimezone) : this.uid;

      var attendees = this.attendees = [];

      vevent.getAllProperties('attendee').forEach(function(att) {
        var id = att.getFirstValue();
        if (!id) {
          return;
        }
        var cn = att.getParameter('cn');
        var mail = calendarUtils.removeMailto(id);
        var partstat = att.getParameter('partstat');
        attendees.push({
          fullmail: calendarUtils.fullmailOf(cn, mail),
          email: mail,
          name: cn || mail,
          partstat: partstat,
          displayName: cn || mail
        });
      });

      var organizer = vevent.getFirstProperty('organizer');
      if (organizer) {
        var mail = calendarUtils.removeMailto(organizer.getFirstValue());
        var cn = organizer.getParameter('cn');
        this.organizer = {
          fullmail: calendarUtils.fullmailOf(cn, mail),
          email: mail,
          name: cn || mail,
          displayName: cn || mail
        };
      }

      var recurrence = vevent.getFirstPropertyValue('rrule');
      if (recurrence) {
        this.recur = {};
        this.recur.freq = recurrence.freq;
        this.recur.interval = recurrence.interval ? parseInt(recurrence.interval) : 1;

        if (recurrence.until) {
          this.recur.until = FCMoment(recurrence.until.toJSDate());
        }
        if (recurrence.count) {
          this.recur.count = parseInt(recurrence.count);
        }
        this.recur.byday = recurrence.byday || [];
      }

      // NOTE: changing any of the above properties won't update the vevent, or
      // vice versa.
      this.vcalendar = vcalendar;
      this.vevent = vevent;
      extendedProperties = extendedProperties || {};
      this.path = extendedProperties.path;
      this.etag = extendedProperties.etag;
      this.gracePeriodTaskId = extendedProperties.gracePeriodTaskId;
    }

    CalendarShell.toICAL = function toICAL(shell) {
      var uid = shell.uid || uuid4.generate();
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', uid);
      vevent.addPropertyWithValue('summary', shell.title);

      var dtstart = ICAL.Time.fromJSDate(shell.start.toDate());
      var dtend = ICAL.Time.fromJSDate(shell.end.toDate());

      dtstart.isDate = shell.allDay;
      dtend.isDate = shell.allDay;

      if (shell.organizer) {
        var organizer = vevent.addPropertyWithValue('organizer', calendarUtils.prependMailto(shell.organizer.email || shell.organizer.emails[0]));
        organizer.setParameter('cn', shell.organizer.displayName || calendarUtils.displayNameOf(shell.organizer.firstname, shell.organizer.lastname));
      }

      vevent.addPropertyWithValue('dtstart', dtstart).setParameter('tzid', timezoneLocal);
      vevent.addPropertyWithValue('dtend', dtend).setParameter('tzid', timezoneLocal);
      vevent.addPropertyWithValue('transp', shell.allDay ? 'TRANSPARENT' : 'OPAQUE');

      if (shell.location) {
        vevent.addPropertyWithValue('location', shell.location);
      }

      if (shell.description) {
        vevent.addPropertyWithValue('description', shell.description);
      }

      if (shell.attendees && shell.attendees.length) {
        shell.attendees.forEach(function(attendee) {
          var mail = attendee.email || attendee.emails[0];
          var mailto = calendarUtils.prependMailto(mail);
          var property = vevent.addPropertyWithValue('attendee', mailto);
          property.setParameter('partstat', attendee.partstat || ICAL_PROPERTIES.partstat.needsaction);
          property.setParameter('rsvp', ICAL_PROPERTIES.rsvp.true);
          property.setParameter('role', ICAL_PROPERTIES.role.reqparticipant);
          if (attendee.displayName && attendee.displayName !== mail) {
            property.setParameter('cn', attendee.displayName);
          }
        });
      }

      if (shell.recur && shell.recur.freq) {
        var data = {};
        data.freq = shell.recur.freq;
        if (angular.isNumber(shell.recur.interval)) {
          data.interval = [shell.recur.interval];
        }
        if (shell.recur.until) {
          data.until = ICAL.Time.fromJSDate(shell.recur.until);
        }
        if (angular.isNumber(shell.recur.count)) {
          data.count = [shell.recur.count];
        }
        if (shell.recur.byday && shell.recur.byday.length > 0) {
          data.byday = shell.recur.byday;
        }
        var recur = new ICAL.Recur.fromData(data);
        vevent.addPropertyWithValue('rrule', recur);
      }

      vcalendar.addSubcomponent(vevent);
      return vcalendar;
    };

    CalendarShell.from = function from(ical, extendedProperties) {
      return new CalendarShell(new ICAL.Component(ical), extendedProperties);
    };

    return CalendarShell;
  });
