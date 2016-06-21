'use strict';

angular.module('esn.calendar')

  .factory('CalendarShell', function($q, _, ICAL, eventAPI, fcMoment, uuid4, jstz, calendarUtils, masterEventCache, RRuleShell, VAlarmShell, ICAL_PROPERTIES, EVENT_MODIFY_COMPARE_KEYS) {
    var localTimezone = jstz.determine().name();

    function setDatetimePropertyFromIcalTime(component, propertyName, icalTime) {
      var property = component.getFirstProperty(propertyName);

      if (!property) {
        property = new ICAL.Property(propertyName);
        component.addProperty(property);
      }

      property.setValue(icalTime.convertToZone(ICAL.Timezone.utcTimezone));
      if (icalTime.zone.tzid === ICAL.Timezone.utcTimezone.tzid) {
        property.removeParameter('tzid');
      } else {
        property.setParameter('tzid', icalTime.zone.tzid);
      }
    }

    function sameIcalTime(a, b) {
      if (!a) {
        return !b;
      }

      return a.compare(b) === 0 && Boolean(a.isDate) === Boolean(b.isDate);
    }

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
      // the _getExtendedProperties method.
      extendedProperties = extendedProperties || {};
      this.path = extendedProperties.path;
      this.etag = extendedProperties.etag;
      this.backgroundColor = extendedProperties.backgroundColor;
      this.gracePeriodTaskId = extendedProperties.gracePeriodTaskId;
      this.icalEvent = new ICAL.Event(this.vevent);

      this.timezones = _.chain(this.vcalendar.getAllSubcomponents('vtimezone')).map(ICAL.Timezone.fromData).indexBy('tzid').value();

      if (this.icalEvent.startDate) {
        this.icalEvent.startDate.zone = this.timezones[this.icalEvent.startDate.timezone] || this.icalEvent.startDate.zone;
        //trying to acesss endDate if startDate is not define crash ICAL.js
        if (this.icalEvent.endDate) {
          this.icalEvent.endDate.zone = this.timezones[this.icalEvent.endDate.timezone] || this.icalEvent.endDate.zone;
        }
      }

      var localTimezoneFound = _.contains(Object.keys(this.timezones), localTimezone);

      if (!localTimezoneFound) {
        this.vcalendar.addSubcomponent(ICAL.TimezoneService.get(localTimezone).component);
      }
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
          this.__start = fcMoment(this.icalEvent.startDate);
        }

        return this.__start;
      },
      set start(value) {
        this.__start = undefined;
        if (value) {
          var dtstart = ICAL.Time.fromJSDate(value.toDate(), true).convertToZone(ICAL.TimezoneService.get(localTimezone));

          dtstart.isDate = !value.hasTime();

          if (this.isRecurring() && !sameIcalTime(this.icalEvent.startDate, dtstart)) {
            this.deleteAllException();
          }

          this.vevent.updatePropertyWithValue('dtstart', dtstart).setParameter('tzid', localTimezone);
        }
      },

      get end() {
        if (!this.__end) {
          this.__end = fcMoment(this.icalEvent.endDate);
        }

        return this.__end;
      },
      set end(value) {
        this.__end = undefined;
        if (value) {
          var dtend = ICAL.Time.fromJSDate(value.toDate(), true).convertToZone(ICAL.TimezoneService.get(localTimezone));

          dtend.isDate = !value.hasTime();

          if (this.isRecurring() && !sameIcalTime(this.icalEvent.endDate, dtend)) {
            this.deleteAllException();
          }

          this.vevent.updatePropertyWithValue('dtend', dtend).setParameter('tzid', localTimezone);
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
          var recid = ICAL.Time.fromJSDate(value.toDate(), true);

          recid.isDate = !value.hasTime();
          this.vevent.updatePropertyWithValue('recurrence-id', recid);
        }
      },

      get rrule() {
        var rrule = this.vevent.getFirstPropertyValue('rrule');
        if (rrule && !this.__rrule) {
          this.__rrule = new RRuleShell(rrule, this.vevent);
        }
        return this.__rrule;
      },
      set rrule(value) {
        this.__rrule = undefined;
        if (!value) {
          this.vevent.removeProperty('rrule');
          return;
        }
        if (value.until) {
          value.until = ICAL.Time.fromJSDate(value.until);
        }
        var rrule = new ICAL.Recur.fromData(value);
        this.vevent.updatePropertyWithValue('rrule', rrule);
      },
      isRecurring: function() {
        return this.icalEvent.isRecurring();
      },
      deleteInstance: function(instance) {
        this._removeOccurenceFromVcalendar(instance);
        this.vevent.addPropertyWithValue('exdate', instance.vevent.getFirstPropertyValue('recurrence-id'));
      },
      deleteAllException: function() {
        this.vcalendar.getAllSubcomponents('vevent').forEach(function(vevent) {
          if (vevent.getFirstPropertyValue('recurrence-id')) {
            this.vcalendar.removeSubcomponent(vevent);
          }
        }, this);
      },
      _computeNonExceptionnalInstance: function(instanceDetails) {
        var instance = this.clone();
        instance.deleteAllException();
        instance.vevent.removeProperty('rrule');
        instance.vevent.removeProperty('exdate');

        setDatetimePropertyFromIcalTime(instance.vevent, 'recurrence-id', instanceDetails.recurrenceId.convertToZone(ICAL.Timezone.utcTimezone));
        setDatetimePropertyFromIcalTime(instance.vevent, 'dtstart', instanceDetails.startDate);
        setDatetimePropertyFromIcalTime(instance.vevent, 'dtend', instanceDetails.endDate);

        return instance;
      },
      expand: function(startDate, endDate, maxElement) {
        if (!this.icalEvent.isRecurring()) {
          return [];
        }
        if (!endDate && !maxElement && !this.rrule.count && !this.rrule.until) {
          throw new Error('Could not list all element of a reccuring event that never end');
        }

        this.vcalendar.getAllSubcomponents('vevent').forEach(function(vevent) {
          if (vevent.getFirstPropertyValue('recurrence-id')) {
            var event = new ICAL.Event(vevent);

            if (event.startDate) {
              event.startDate.zone = this.timezones[event.startDate.timezone] || event.startDate.zone;
              //trying to acesss endDate if startDate is not define crash ICAL.js
              if (event.endDate) {
                event.endDate.zone = this.timezones[event.endDate.timezone] || event.endDate.zone;
              }
            }
            this.icalEvent.relateException(event);
          }
        }, this);

        var iterator = this.icalEvent.iterator(this.icalEvent.startDate);
        var currentDatetime, currentEvent, currentDetails, result = [];

        function getException(icalEvent, recurrenceId) {
          return _.find(icalEvent.exceptions, function(exception) {
            return exception.recurrenceId.compare(recurrenceId) === 0;
          });
        }

        function beforeEndDate(currentDatetime) {
          if (endDate.isAfter(currentDatetime.toJSDate())) {
            return true;
          } else if (!endDate.hasTime()) {
            return endDate.isSame(currentDatetime.toJSDate(), 'day');
          }

          return false;
        }

        while ((currentDatetime = iterator.next()) &&
            (!endDate || beforeEndDate(currentDatetime)) &&
            (!maxElement || result.length < maxElement)) {

          if (!startDate || startDate.isBefore(currentDatetime.toJSDate()) || (!startDate.hasTime() && startDate.isSame(currentDatetime.toJSDate(), 'day'))) {
            currentDetails = this.icalEvent.getOccurrenceDetails(currentDatetime);

            currentEvent = getException(this.icalEvent, currentDetails.recurrenceId);

            if (currentEvent) {
              currentEvent = new CalendarShell(new ICAL.Component(currentEvent.component.toJSON()), this._getExtendedProperties());
            } else {
              currentEvent = this._computeNonExceptionnalInstance(currentDetails);
            }

            result.push(currentEvent);
          }
        }

        return result;
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
          var isOrganizer = this.organizer && (mail === this.organizer.email);
          var mailto = calendarUtils.prependMailto(mail);
          var property = this.vevent.addPropertyWithValue('attendee', mailto);
          property.setParameter('partstat', attendee.partstat || (isOrganizer ? ICAL_PROPERTIES.partstat.accepted : ICAL_PROPERTIES.partstat.needsaction));
          property.setParameter('rsvp', isOrganizer ? ICAL_PROPERTIES.rsvp.false : ICAL_PROPERTIES.rsvp.true);
          property.setParameter('role', isOrganizer ? ICAL_PROPERTIES.role.chair : ICAL_PROPERTIES.role.reqparticipant);
          if (attendee.displayName && attendee.displayName !== mail) {
            property.setParameter('cn', attendee.displayName);
          }
        }.bind(this));
      },

      get alarm() {
        if (!this.__alarm) {
          var valarm = this.vevent.getFirstSubcomponent('valarm');
          if (valarm) {
            this.__alarm = new VAlarmShell(valarm, this.vevent);
          }
        }
        return this.__alarm;
      },
      set alarm(value) {
        if (!value) {
          this.__alarm = undefined;
          this.vevent.removeSubcomponent('valarm');
        } else {
          if (!value.trigger || !value.attendee) {
            throw new Error('invalid alarm set value, missing trigger or attendee');
          }
          this.__alarm = undefined;
          this.vevent.removeSubcomponent('valarm');

          var SUMMARY_TEMPLATE = 'Pending event! <%- summary %>';
          var DESCRIPTION_TEMPLATE =
            'This is an automatic alarm sent by OpenPaas\\n' +
            'PENDING EVENT!\\n' +
            'The event <%- summary %> will start <%- diffStart %>\\n' +
            'start: <%- start %> \\n' +
            'end: <%- end %> \\n' +
            'location: <%- location %> \\n' +
            'More details:\\n' +
            'https://localhost:8080/#/calendar/<%- calendarId %>/event/<%- eventId %>/consult';

          var valarm = new ICAL.Component('valarm');
          valarm.addPropertyWithValue('trigger', value.trigger);
          valarm.addPropertyWithValue('action', 'EMAIL');
          valarm.addPropertyWithValue('summary', _.template(SUMMARY_TEMPLATE)({summary: this.summary}));
          valarm.addPropertyWithValue('description', _.template(DESCRIPTION_TEMPLATE)({
            summary: this.summary,
            start: this.start,
            end: this.end,
            diffStart: fcMoment(new Date()).to(this.start),
            location: this.location,
            calendarId: this.calendarId,
            eventId: this.id
          }));

          var mailto = calendarUtils.prependMailto(value.attendee);
          valarm.addPropertyWithValue('attendee', mailto);
          this.vevent.addSubcomponent(valarm);
        }
      },
      removeAlarm: function() {
        this.vevent.removeSubcomponent('valarm');
      },

      /**
       * Change the partstat of all attendees (except the organizer) to a specific status. if emails is defined, change only attendees matching with emails.
       * @param  {String} status a partstat
       * @param  {[String]} emails optional, used to filter which attendee to change participation of
       * @return {Boolean} true or false depending of if an attendee has been modified or not
       */
      changeParticipation: function(status, emails) {
        this.__attendees = undefined;
        var needsModify = false;
        var attendees = this.vevent.getAllProperties('attendee');
        if (this.organizer) {
          var organizerMailto = calendarUtils.prependMailto(this.organizer.email);
          attendees = attendees.filter(function(attendee) {
            return organizerMailto && attendee.getFirstValue() !== organizerMailto;
          });
        }
        attendees.forEach(function(attendee) {
          if (!emails) {
            needsModify = needsModify || attendee.getParameter('partstat') !== status;
            attendee.setParameter('partstat', status);
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
       * Change the partstat of the organizer to a specific status.
       * @param  {String} status a partstat
       */
      setOrganizerPartStat: function(status) {
        if (!this.organizer) {
          return;
        }
        this.__organizerPartStat = undefined;
        var organizerMailto = calendarUtils.prependMailto(this.organizer.email);
        var organizerAsAttendee = this.vevent.getAllProperties('attendee').filter(function(attendee) {
          return attendee.getFirstValue() === organizerMailto;
        });
        if (organizerAsAttendee[0]) {
          this.vevent.removeProperty(organizerAsAttendee[0]);
        }
        var property = this.vevent.addPropertyWithValue('attendee', calendarUtils.prependMailto(this.organizer.email));
        property.setParameter('partstat', status || ICAL_PROPERTIES.partstat.accepted);
        property.setParameter('rsvp', ICAL_PROPERTIES.rsvp.false);
        property.setParameter('role', ICAL_PROPERTIES.role.chair);
        this.__attendees = null;
      },

      /**
       * Get the partstat of the organizer.
       * @return {String} a partstat
       */
      getOrganizerPartStat: function() {
        if (this.__organizerPartStat) {
          return this.__organizerPartStat;
        }
        if (!this.organizer) {
          return null;
        }
        var organizerMailto = calendarUtils.prependMailto(this.organizer.email);
        var organizerAsAttendee = this.vevent.getAllProperties('attendee').filter(function(attendee) {
          return attendee.getFirstValue() === organizerMailto;
        });
        if (organizerAsAttendee[0]) {
          this.__organizerPartStat = organizerAsAttendee[0].getParameter('partstat');
          return this.__organizerPartStat;
        }
        return null;
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

        return new CalendarShell(clonedComp, this._getExtendedProperties());
      },

      _getExtendedProperties: function() {
        return {
          path: this.path,
          etag: this.etag,
          backgroundColor: this.backgroundColor,
          gracePeriodTaskId: this.gracePeriodTaskId
        };
      },

      /**
       * Return true if this equals that.
       *
       * @return {Boolean} the result
       */
      equals: function(that, optionalSubsetKeys) {
        var keys = optionalSubsetKeys || EVENT_MODIFY_COMPARE_KEYS;
        var self = this;

        return keys.every(function(key) {
          switch (key) {
            case 'start':
            case 'end':
            case 'recurrenceId':
              if (self[key] === that[key]) { return true; }
              return self[key]._isAMomentObject && that[key]._isAMomentObject && self[key].isSame(that[key]);
            case 'rrule':
              if (!self.rrule) { return !that.rrule; }
              if (self.rrule === that.rrule) { return true; }
              return self.rrule.equals(that.rrule);
            case 'alarm':
              if (!self.alarm) { return !that.alarm; }
              if (self.alarm === that.alarm) { return true; }
              return self.alarm.equals(that.alarm);
            default:
              return angular.equals(self[key], that[key]);
          }
        });
      },

      /**
       * Find or retrieve the modified master event for this shell. If the
       * shell is already a master event, return a promise with this. Otherwise
       * either find it in the vcalendar parent, or retrieve it from the
       * server and register the instance inside the master.
       *
       * @return {Promise}      Promise resolving with the master shell.
       */
      getModifiedMaster: function() {
        if (!this.isInstance()) {
          return $q.when(this);
        }

        var fromCache = masterEventCache.get(this.path);
        if (fromCache) {
          fromCache.modifyOccurrence(this);
          return $q.when(fromCache);
        }

        // Not found, we need to retrieve the event
        return eventAPI.get(this.path).then(function(response) {
          var mastershell = new CalendarShell(new ICAL.Component(response.data), this._getExtendedProperties());
          mastershell.modifyOccurrence(this);
          return mastershell;
        }.bind(this));
      },
      isRealException: function(instance) {
        var currentDetails = this.icalEvent.getOccurrenceDetails(instance.vevent.getFirstPropertyValue('recurrence-id'));
        var regularException = this._computeNonExceptionnalInstance(currentDetails);

        return !instance.equals(regularException);
      },
      /**
       * For a master shell, modifies a specific instance so it appears as a
       * modified occurrence in the vcalendar. Can not be called on instances.
       *
       * @param {CalendarShell} instance        The instance to add as modified.
       * @param {CalendarShell} notRefreshCache Do not refresh cache
       */
      modifyOccurrence: function(instance, notRefreshCache) {
        if (this.isInstance()) {
          throw new Error('Cannot modify occurrence on an instance');
        }

        if (!this.isRealException(instance)) {
          return;
        }

        this._removeOccurenceFromVcalendar(instance);
        this.vcalendar.addSubcomponent(instance.clone().vevent);
        !notRefreshCache && masterEventCache.save(this);
      },

      _removeOccurenceFromVcalendar: function(instance) {
        var vevents = this.vcalendar.getAllSubcomponents('vevent');
        for (var i = 0, len = vevents.length; i < len; i++) {
          var vevent = vevents[i];
          var recId = vevent.getFirstPropertyValue('recurrence-id');
          if (recId) {
            recId.zone = this.timezones[recId.timezone] || recId.zone;
            if (instance.recurrenceId.isSame(recId.toJSDate())) {
              this.vcalendar.removeSubcomponent(vevent);
              break;
            }
          }
        }
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
      angular.forEach(obj, function(prop, key) {
        newShell[key] = prop;
      });
      return newShell;
    };

    return CalendarShell;
  })

  .factory('RRuleShell', function(ICAL, fcMoment, RRULE_MODIFY_COMPARE_KEYS) {
    function RRuleShell(rrule, vevent) {
      this.rrule = rrule;
      this.vevent = vevent;
      this.updateParentEvent();
    }

    RRuleShell.prototype = {
      equals: function(that) {
        if (!that) { return false; }
        if (that === this) { return true; }
        var self = this;

        return RRULE_MODIFY_COMPARE_KEYS.every(function(key) {
          return angular.equals(self[key], that[key]);
        });
      },

      isValid: function() {
        return !!this.rrule.freq;
      },

      updateParentEvent: function() {
        if (this.isValid()) {
          var intervalTmp = this.rrule.interval;

          this.rrule.interval = this.rrule.interval || [1];
          this.vevent.updatePropertyWithValue('rrule', new ICAL.Recur.fromData(this.rrule));
          this.rrule.interval = intervalTmp;
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
        if (!this.__interval && this.rrule && this.rrule.interval) {
          this.__interval = parseInt(this.rrule.interval, 10);
        } else {
          this.__interval = this.__interval || null;
        }

        return this.__interval;
      },
      set interval(value) {
        this.__interval = undefined;
        this.rrule.interval = angular.isNumber(value) ? [value] : null;
        this.updateParentEvent();
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
  })

  .factory('VAlarmShell', function(ALARM_MODIFY_COMPARE_KEYS) {
    function VAlarmShell(valarm, vevent) {
      this.valarm = valarm;
      this.vevent = vevent;
    }

    VAlarmShell.prototype = {
      equals: function(that) {
        if (!that) { return false; }
        if (that === this) { return true; }
        var self = this;

        return ALARM_MODIFY_COMPARE_KEYS.every(function(key) {
          if (key === 'trigger') {
            return self.trigger.compare(that.trigger) === 0;
          } else {
            return angular.equals(self[key], that[key]);
          }
        });
      },

      get action() { return this.valarm.getFirstPropertyValue('action'); },
      get trigger() { return this.valarm.getFirstPropertyValue('trigger'); },
      get description() { return this.valarm.getFirstPropertyValue('description'); },
      get summary() { return this.valarm.getFirstPropertyValue('summary'); },
      get attendee() { return this.valarm.getFirstPropertyValue('attendee'); }
    };

    return VAlarmShell;
  });
