'use strict';

angular.module('esn.calendar')

  .factory('CalendarShell', function($q, ICAL, eventAPI, fcMoment, uuid4, jstz, calendarUtils, masterEventCache, RRuleShell, ICAL_PROPERTIES, _) {
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
        vcalendar = new ICAL.Component('vcalendar');
        vcalendar.addSubcomponent(vevent);
      } else {
        throw new Error('Cannot create a shell - Unsupported vcomponent');
      }

      this.vcalendar = vcalendar;
      this.vevent = vevent;

      // NOTE: adding additional extended properties also requires adjusting
      // the clone method.
      extendedProperties = extendedProperties || {};
      this.path = extendedProperties.path;
      this.etag = extendedProperties.etag;
      this.backgroundColor = extendedProperties.backgroundColor;
      this.gracePeriodTaskId = extendedProperties.gracePeriodTaskId;
    }

    CalendarShell.prototype = {
      get uid() { return this.vevent.getFirstPropertyValue('uid'); },
      get id() { return this.recurrenceId ? this.uid + '_' + this.vevent.getFirstPropertyValue('recurrence-id').convertToZone(ICAL.Timezone.utcTimezone) : this.uid; },

      get calendarId() {
        return this.path && (this.path.match(new RegExp('/([^/]+)/[^/]+?/?$')) || [])[1];
      },

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

      get sequence() { return this.vevent.getFirstPropertyValue('sequence') || 0; },
      set sequence(value) { this.vevent.updatePropertyWithValue('sequence', value); },

      get start() {
        if (!this.__start) {
          this.__start = fcMoment(this.vevent.getFirstPropertyValue('dtstart'));
        }
        return this.__start;
      },
      set start(value) {
        this.__start = undefined;
        if (value) {
          var dtstart = ICAL.Time.fromJSDate(value.toDate());
          dtstart.isDate = !value.hasTime();
          var startprop = this.vevent.updatePropertyWithValue('dtstart', dtstart);
          startprop.setParameter('tzid', timezoneLocal);
        }
      },

      get end() {
        if (!this.__end) {
          this.__end = fcMoment(this.vevent.getFirstPropertyValue('dtend'));
        }
        return this.__end;
      },
      set end(value) {
        this.__end = undefined;
        if (value) {
          var dtend = ICAL.Time.fromJSDate(value.toDate());
          dtend.isDate = !value.hasTime();
          var endprop = this.vevent.updatePropertyWithValue('dtend', dtend);
          endprop.setParameter('tzid', timezoneLocal);
        }
      },

      get allDay() { return this.vevent.getFirstProperty('dtstart').type === 'date'; },

      get recurrenceId() {
        if (!this.__recurrenceId) {
          var recurrenceId = this.vevent.getFirstPropertyValue('recurrence-id');
          if (recurrenceId) {
            this.__recurrenceId = fcMoment(recurrenceId);
          }
        }
        return this.__recurrenceId;
      },
      set recurrenceId(value) {
        this.__recurrenceId = undefined;
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
        if (rrule && !this.__rrule) {
          this.__rrule = new RRuleShell(rrule, this.vevent);
        }
        return this.__rrule;
      },

      isRecurring: function() {
        return (new ICAL.Event(this.vevent)).isRecurring();
      },
      expand: function(startDate, endDate, maxElement) {
        var IEvent = new ICAL.Event(this.vevent);
        if (!IEvent.isRecurring()) {
          return [];
        }
        if (!endDate && !maxElement && !this.rrule.count && !this.rrule.until) {
          throw new Error('Could not list all element of a reccuring event that never end');
        }

        var subEventExceptions = this.vcalendar.getAllSubcomponents('vevent').filter(function(vevent) {
          return vevent.getFirstPropertyValue('recurrence-id');
        });

        var iterator = IEvent.iterator(IEvent.startDate);
        var currentDatetime, currentEvent, currentDetails, result = [];

        while ((currentDatetime = iterator.next()) &&
            (!endDate || endDate.isAfter(currentDatetime.toJSDate())) &&
            (!maxElement || result.length < maxElement)) {

          if (!startDate || startDate.isBefore(currentDatetime.toJSDate())) {
            currentDetails = IEvent.getOccurrenceDetails(currentDatetime);

            //because we screwed up timezone on dtstart, recurrenceId are computed in dtstart timezone but marked as floating datetime
            var tzid = this.vevent.getFirstProperty('dtstart').getParameter('tzid'); //so we get the dtstart timezone
            var recurrenceId  = currentDetails.recurrenceId.convertToZone(ICAL.Timezone.utcTimezone); //mark recurrence id as UTC date
            var utcOffset = ICAL.Duration.fromSeconds(-fcMoment.tz(tzid).utcOffset() * 60);
            recurrenceId.addDuration(utcOffset); //and make it correct in UTC timezone

            currentEvent = null;

            //looking if current instance is an exception
            for (var i = 0, len = subEventExceptions.length; i < len; i++) {
              var vevent = subEventExceptions[i];
              if (recurrenceId.compare(vevent.getFirstPropertyValue('recurrence-id')) === 0) {
                currentEvent = new CalendarShell(vevent, {
                  path: this.path,
                  backgroundColor: this.backgroundColor,
                  etag: this.etag
                });
                break;
              }
            }

            if (!currentEvent) {
              currentEvent = this.clone();
              currentEvent.vevent.updatePropertyWithValue('recurrence-id', recurrenceId);

              currentEvent.vevent.getFirstProperty('dtstart').setValue(currentDetails.startDate);
              currentEvent.vevent.getFirstProperty('dtend').setValue(currentDetails.endDate);
              currentEvent.vevent.removeProperty('rrule');
            }

            result.push(currentEvent);
          }
        }

        return result;
      },

      set rrule(value) {
        this.__rrule = undefined;
        if (value.until) {
          value.until = ICAL.Time.fromJSDate(value.until);
        }
        var rrule = new ICAL.Recur.fromData(value);
        this.vevent.updatePropertyWithValue('rrule', rrule);
      },

      get organizer() {
        if (!this.__organizer) {
          var organizer = this.vevent.getFirstProperty('organizer');
          if (organizer) {
            var mail = calendarUtils.removeMailto(organizer.getFirstValue());
            var cn = organizer.getParameter('cn');
            this.__organizer = {
              fullmail: calendarUtils.fullmailOf(cn, mail),
              email: mail,
              name: cn || mail,
              displayName: cn || mail
            };
          }
        }
        return this.__organizer;
      },
      set organizer(value) {
        this.__organizer = undefined;
        var organizerValue = calendarUtils.prependMailto(value.email || value.emails[0]);
        var organizerCN = value.displayName || calendarUtils.displayNameOf(value.firstname, value.lastname);
        var organizer = this.vevent.updatePropertyWithValue('organizer', organizerValue);
        organizer.setParameter('cn', organizerCN);
      },

      get attendees() {
        if (this.__attendees) {
          return this.__attendees;
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
        this.__attendees = attendees;
        return this.__attendees;
      },
      set attendees(values) {
        if (!angular.isArray(values)) {
          return;
        }
        this.__attendees = undefined;
        this.vevent.removeAllProperties('attendee');
        values.forEach(function(attendee) {
          var mail = attendee.email || attendee.emails[0];
          var mailto = calendarUtils.prependMailto(mail);
          var property = this.vevent.addPropertyWithValue('attendee', mailto);
          property.setParameter('partstat', attendee.partstat || ICAL_PROPERTIES.partstat.needsaction);
          property.setParameter('rsvp', ICAL_PROPERTIES.rsvp.true);
          property.setParameter('role', ICAL_PROPERTIES.role.reqparticipant);
          if (attendee.displayName && attendee.displayName !== mail) {
            property.setParameter('cn', attendee.displayName);
          }
        }.bind(this));
      },

      /**
       * Change the partstat of all attendees to a specific status. if emails is defined, change only attendees matching with emails.
       * @param  {String} status a partstat
       * @param  {[String]} emails optional, used to filter which attendee to change participation of
       * @return {Boolean} true or false depending of if an attendee has been modified or not
       */
      changeParticipation: function(status, emails) {
        this.__attendees = undefined;
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
        var clonedComp = new ICAL.Component(_.cloneDeep(this.vcalendar.toJSON()));
        return new CalendarShell(clonedComp, {
          path: this.path,
          etag: this.etag,
          backgroundColor: this.backgroundColor,
          gracePeriodTaskId: this.gracePeriodTaskId
        });
      },

      /**
       * Find or retrieve the modified master event for this shell. If the
       * shell is already a master event, return a promise with this. Otherwise
       * either find it in the vcalendar parent, or retrieve it from the
       * server.
       *
       * @return {Promise}      Promise resolving with the master shell.
       */
      getModifiedMaster: function() {
        if (!this.isInstance()) {
          return $q.when(this);
        }

        var fromCache = masterEventCache.getMasterEvent(this.path);
        if (fromCache) {
          fromCache.modifyOccurrence(this);
          return $q.when(fromCache);
        }

        // Not found, we need to retrieve the event
        return eventAPI.get(this.path).then(function(response) {
          var mastershell = new CalendarShell(new ICAL.Component(response.data), {
            path: this.path,
            etag: this.etag,
            gracePeriodTaskId: this.gracePeriodTaskId
          });
          mastershell.modifyOccurrence(this);
          return mastershell;
        }.bind(this));
      },

      /**
       * For a master shell, modifies a specific instance so it appears as a
       * modified occurrence in the vcalendar. Can not be called on instances.
       *
       * @param {CalendarShell} instance        The instance to add as modified.
       */
      modifyOccurrence: function(instance) {
        if (this.isInstance()) {
          throw new Error('Cannot modify occurrence on an instance');
        }
        var vevents = this.vcalendar.getAllSubcomponents('vevent');

        for (var i = 0, len = vevents.length; i < len; i++) {
          var vevent = vevents[i];
          var recId = vevent.getFirstPropertyValue('recurrence-id');
          if (recId && instance.recurrenceId.isSame(recId.toJSDate())) {
            this.vcalendar.removeSubcomponent(vevent);
            break;
          }
        }

        this.vcalendar.addSubcomponent(instance.clone().vevent);
        masterEventCache.saveMasterEvent(this);
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

    CalendarShell.fromJSON = function(json) {
      return new CalendarShell(new ICAL.Component(json.vcalendar), {path: json.path, etag: json.etag, gracePeriodTaskId: json.gracePeriodTaskId});
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
        this.__interval = this.__interval || this.rrule ? (this.rrule.interval ? parseInt(this.rrule.interval, 10) : 1) : null;
        return this.__interval;
      },
      set interval(value) {
        if (angular.isNumber(value)) {
          this.__interval = undefined;
          this.rrule.interval = [value];
          this.updateParentEvent();
        }
      },

      get until() {
        if (!this.rrule || !this.rrule.until) {
          return null;
        }
        this.__until = this.__until || fcMoment(this.rrule.until.toJSDate());
        return this.__until;
      },
      set until(value) {
        this.__until = undefined;
        this.rrule.until = value ? ICAL.Time.fromJSDate(value, true) : undefined;
        this.updateParentEvent();
      },

      get count() {
        if (!this.rrule || !this.rrule.count) {
          return null;
        }
        this.__count = this.__count || parseInt(this.rrule.count, 10);
        return this.__count;
      },
      set count(value) {
        this.__count = undefined;
        this.rrule.count = angular.isNumber(value) ? [value] : undefined;
        this.updateParentEvent();
      },

      get byday() {
        if (!this.__byday) {
          this.__byday = this.rrule && this.rrule.byday ? this.rrule.byday : [];
        }
        return this.__byday;
      },
      set byday(value) {
        this.__byday = undefined;
        this.rrule.byday = value;
        this.updateParentEvent();
      }
    };

    return RRuleShell;
  });
