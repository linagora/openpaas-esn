'use strict';

angular.module('esn.calendar')

  .factory('CalendarShell', function(ICAL, fcMoment, uuid4, jstz, calendarUtils, RRuleShell, ICAL_PROPERTIES) {
    var timezoneLocal = this.timezoneLocal || jstz.determine().name();
    /**
     * A shell that wraps an ical.js VEVENT component to be compatible with
     * fullcalendar's objects.
     * Fullcalendar relevant properties are (see http://fullcalendar.io/docs/event_data/Event_Object/):
     *   * id
     *   * title
     *   * allDay
     *   * start
     *   * end
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

      this.vcalendar = vcalendar;
      this.vevent = vevent;

      // NOTE: adding additional extended properties also requires adjusting
      // the clone method.
      extendedProperties = extendedProperties || {};
      this.path = extendedProperties.path;
      this.etag = extendedProperties.etag;
      this.gracePeriodTaskId = extendedProperties.gracePeriodTaskId;
    }

    CalendarShell.prototype = {
      get uid() { return this.vevent.getFirstPropertyValue('uid'); },
      get id() { return this.recurrenceId ? this.uid + '_' + this.recurrenceId.format() : this.uid; },

      get title() { return this.vevent.getFirstPropertyValue('summary'); },
      set title(value) { this.vevent.updatePropertyWithValue('summary', value); },

      get summary() { return this.vevent.getFirstPropertyValue('summary'); },
      set summary(value) { this.vevent.updatePropertyWithValue('summary', value); },

      get location() { return this.vevent.getFirstPropertyValue('location'); },
      set location(value) { this.vevent.updatePropertyWithValue('location', value); },

      get description() { return this.vevent.getFirstPropertyValue('description'); },
      set description(value) { this.vevent.updatePropertyWithValue('description', value); },

      get status() { return this.vevent.getFirstPropertyValue('status'); },
      set status(value) { this.vevent.updatePropertyWithValue('status', value); },

      get start() {
        if (!this._start) {
          this._start = fcMoment(this.vevent.getFirstPropertyValue('dtstart'));
        }
        return this._start;
      },
      set start(value) {
        this._start = undefined;
        var dtstart = ICAL.Time.fromJSDate(value.toDate());
        dtstart.zone = null;
        dtstart.isDate = !value.hasTime();
        var startprop = this.vevent.updatePropertyWithValue('dtstart', dtstart);
        startprop.setParameter('tzid', timezoneLocal);
      },

      get end() {
        if (!this._end) {
          this._end = fcMoment(this.vevent.getFirstPropertyValue('dtend'));
        }
        return this._end;
      },
      set end(value) {
        this._end = undefined;
        var dtend = ICAL.Time.fromJSDate(value.toDate());
        dtend.zone = null;
        dtend.isDate = !value.hasTime();
        var endprop = this.vevent.updatePropertyWithValue('dtend', dtend);
        endprop.setParameter('tzid', timezoneLocal);
      },

      get allDay() { return this.vevent.getFirstProperty('dtstart').type === 'date'; },

      get recurrenceId() {
        if (!this._recurrenceId) {
          var recurrenceId = this.vevent.getFirstPropertyValue('recurrence-id');
          if (recurrenceId) {
            this._recurrenceId = fcMoment(recurrenceId);
          }
        }
        return this._recurrenceId;
      },
      set recurrenceId(value) {
        this._recurrenceId = undefined;
        if (value) {
          var recid = ICAL.Time.fromJSDate(value.toDate());
          recid.zone = ICAL.Timezone.localTimezone;
          recid.isDate = !value.hasTime();
          var recprop = this.vevent.updatePropertyWithValue('recurrence-id', recid);
          recprop.setParameter('tzid', timezoneLocal);
        }
      },

      get rrule() {
        var rrule = this.vevent.getFirstPropertyValue('rrule');
        if (rrule && !this._rrule) {
          this._rrule = new RRuleShell(rrule, this.vevent);
        }
        return this._rrule;
      },

      set rrule(value) {
        this._rrule = undefined;
        if (value.until) {
          value.until = ICAL.Time.fromJSDate(value.until);
        }
        var rrule = new ICAL.Recur.fromData(value);
        this.vevent.updatePropertyWithValue('rrule', rrule);
      },

      get organizer() {
        if (!this._organizer) {
          var organizer = this.vevent.getFirstProperty('organizer');
          if (organizer) {
            var mail = calendarUtils.removeMailto(organizer.getFirstValue());
            var cn = organizer.getParameter('cn');
            this._organizer = {
              fullmail: calendarUtils.fullmailOf(cn, mail),
              email: mail,
              name: cn || mail,
              displayName: cn || mail
            };
          }
        }
        return this._organizer;
      },
      set organizer(value) {
        this._organizer = undefined;
        var organizerValue = calendarUtils.prependMailto(value.email || value.emails[0]);
        var organizerCN = value.displayName || calendarUtils.displayNameOf(value.firstname, value.lastname);
        var organizer = this.vevent.updatePropertyWithValue('organizer', organizerValue);
        organizer.setParameter('cn', organizerCN);
      },

      get attendees() {
        if (this._attendees) {
          return this._attendees;
        }
        var attendees = [];
        this.vevent.getAllProperties('attendee').forEach(function(attendee) {
          var id = attendee.getFirstValue();
          if (!id) {
            return;
          }
          var cn = attendee.getParameter('cn');
          var mail = calendarUtils.removeMailto(id);
          var partstat = attendee.getParameter('partstat');
          attendees.push({
            fullmail: calendarUtils.fullmailOf(cn, mail),
            email: mail,
            name: cn || mail,
            partstat: partstat,
            displayName: cn || mail
          });
        });
        this._attendees = attendees;
        return this._attendees;
      },
      set attendees(values) {
        if (!angular.isArray(values)) {
          return;
        }
        this._attendees = undefined;
        var self = this;
        values.forEach(function(attendee) {
          var mail = attendee.email || attendee.emails[0];
          var mailto = calendarUtils.prependMailto(mail);
          var property = self.vevent.updatePropertyWithValue('attendee', mailto);
          property.setParameter('partstat', attendee.partstat || ICAL_PROPERTIES.partstat.needsaction);
          property.setParameter('rsvp', ICAL_PROPERTIES.rsvp.true);
          property.setParameter('role', ICAL_PROPERTIES.role.reqparticipant);
          if (attendee.displayName && attendee.displayName !== mail) {
            property.setParameter('cn', attendee.displayName);
          }
        });
      },

      /**
       * Change the partstat of all attendees to a specific status. if emails is defined, change only attendees matching with emails.
       * @param  {String} status a partstat
       * @param  {[String]} emails optional, used to filter which attendee to change participation of
       * @return {Boolean} true or false depending of if an attendee has been modified or not
       */
      changeParticipation: function(status, emails) {
        this._attendees = undefined;
        var needsModify = false;
        this.vevent.getAllProperties('attendee').forEach(function(attendee) {
          if (!emails) {
            attendee.setParameter('partstat', status);
            needsModify = true;
          } else {
            var emailMap = {};
            emails.forEach(function(email) { emailMap[calendarUtils.prependMailto(email.toLowerCase())] = true; });
            if ((attendee.getFirstValue().toLowerCase() in emailMap) && attendee.getParameter('partstat') !== status) {
              attendee.setParameter('partstat', status);
              needsModify = true;
            }
          }
        });
        return needsModify;
      },

      /**
       * Return true if the CalendarShell is an occurrence of a serie, false otherwise.
       * @return {Boolean} true or false depending of if the shell is an instance or a master event.
       */
      isInstance: function() { return !!this.recurrenceId; },

      /**
       * Return a deep clone of this shell.
       *
       * @return {CalendarShell} The new clone
       */
      clone: function() {
        var clonedComp = new ICAL.Component(angular.copy(this.vcalendar.toJSON()));
        return new CalendarShell(clonedComp, {
          path: this.path,
          etag: this.etag,
          gracePeriodTaskId: this.gracePeriodTaskId
        });
      }
    };

    /**
     * Build a CalendarShell from a plain jCal Object.
     *
     * @param  {Object} ical                                  A jCal formatted Object
     * @param  {Object} extendedProperties                    Extended properties to save with this shell.
     * @param  {Object} extendedProperties.etag               The ETag for this shell.
     * @param  {Object} extendedProperties.path               The caldav path this event is on.
     * @param  {Object} extendedProperties.gracePeriodTaskId  The task id for the grace period service.
     * @return {CalendarShell}                                The new CalendarShell
     */
    CalendarShell.from = function(ical, extendedProperties) {
      return new CalendarShell(new ICAL.Component(ical), extendedProperties);
    };

    /**
     * Build a CalendarShell from the plain object. The plain object's keys
     * must be settable properties in the CalendarShell object, usually
     * start/end/allDay.
     *
     * @param  {Object} shell         The plain object to set the shell from.
     * @return {CalendarShell}        The new CalendarShell
     */
    CalendarShell.fromIncompleteShell = function(obj) {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vcalendar.addSubcomponent(vevent);

      vevent.addPropertyWithValue('uid', uuid4.generate());
      vevent.addPropertyWithValue('transp', obj.allDay ? 'TRANSPARENT' : 'OPAQUE');

      var newShell = new CalendarShell(vcalendar);
      for (var key in obj) {
        newShell[key] = obj[key];
      }
      return newShell;
    };

    return CalendarShell;
  })

  .factory('RRuleShell', function(fcMoment, ICAL) {
    function RRuleShell(rrule, vevent) {
      this.rrule = rrule;
      this.vevent = vevent;
      this.updateParentEvent();
    }

    RRuleShell.prototype = {
      isValid: function() {
        return !!this.rrule.freq;
      },

      updateParentEvent: function() {
        if (this.isValid()) {
          this.vevent.updatePropertyWithValue('rrule', new ICAL.Recur.fromData(this.rrule));
        } else {
          this.vevent.removeProperty('rrule');
        }
      },

      get freq() {
        return this.rrule ? this.rrule.freq : null;
      },
      set freq(value) {
        this.rrule.freq = value;
        this.updateParentEvent();
      },

      get interval() {
        this._interval = this._interval || this.rrule ? (this.rrule.interval ? parseInt(this.rrule.interval, 10) : 1) : null;
        return this._interval;
      },
      set interval(value) {
        if (angular.isNumber(value)) {
          this._interval = undefined;
          this.rrule.interval = [value];
          this.updateParentEvent();
        }
      },

      get until() {
        if (!this.rrule || !this.rrule.until) {
          return null;
        }
        this._until = this._until || fcMoment(this.rrule.until.toJSDate());
        return this._until;
      },
      set until(value) {
        this._until = undefined;
        this.rrule.until = value ? ICAL.Time.fromJSDate(value, true) : undefined;
        this.updateParentEvent();
      },

      get count() {
        if (!this.rrule || !this.rrule.count) {
          return null;
        }
        this._count = this._count || parseInt(this.rrule.count, 10);
        return this._count;
      },
      set count(value) {
        this._count = undefined;
        this.rrule.count = angular.isNumber(value) ? [value] : undefined;
        this.updateParentEvent();
      },

      get byday() {
        if (!this._byday) {
          this._byday = this.rrule && this.rrule.byday ? this.rrule.byday : [];
        }
        return this._byday;
      },
      set byday(value) {
        this._byday = undefined;
        this.rrule.byday = value;
        this.updateParentEvent();
      }
    };

    return RRuleShell;
  });
