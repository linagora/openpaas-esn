'use strict';

angular.module('esn.calendar')
  .factory('CalendarRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/davserver/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })
  .factory('calendarEventSource', ['$log', 'calendarService', function($log, calendarService) {
    return function(calendarId) {
      return function(start, end, timezone, callback) {
        $log.debug('Getting events for %s', calendarId);
        var path = '/calendars/' + calendarId + '/events/';
        return calendarService.list(path, start, end, timezone).then(callback);
      };
    };
  }])

  .factory('calendarService', ['$rootScope', '$q', '$http', 'CalendarRestangular', 'moment', 'jstz', 'tokenAPI', 'uuid4', 'calendarUtils', 'ICAL', 'ICAL_PROPERTIES', 'socket',
    function($rootScope, $q, $http, CalendarRestangular, moment, jstz, tokenAPI, uuid4, calendarUtils, ICAL, ICAL_PROPERTIES, socket) {
    /**
     * A shell that wraps an ical.js VEVENT component to be compatible with
     * fullcalendar's objects.
     *
     * @param {ICAL.Component} vcalendar     The ical.js VCALENDAR component.
     * @param {String} path                  The path on the caldav server.
     * @param {String} etag                  The ETag of the event.
     */
    function CalendarShell(vcalendar, path, etag) {
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      this.id = vevent.getFirstPropertyValue('uid');
      this.title = vevent.getFirstPropertyValue('summary');
      this.location = vevent.getFirstPropertyValue('location');
      this.description = vevent.getFirstPropertyValue('description');
      this.allDay = vevent.getFirstProperty('dtstart').type === 'date';
      this.start = moment(vevent.getFirstPropertyValue('dtstart').toJSDate());
      this.end = moment(vevent.getFirstPropertyValue('dtend').toJSDate());
      this.formattedDate = this.start.format('MMMM D, YYYY');
      this.formattedStartTime = this.start.format('h');
      this.formattedStartA = this.start.format('a');
      this.formattedEndTime = this.end.format('h');
      this.formattedEndA = this.end.format('a');

      var attendeesPerPartstat = this.attendeesPerPartstat = {};
      var attendees = this.attendees = [];

      vevent.getAllProperties('attendee').forEach(function(att) {
        var id = att.getFirstValue();
        if (!id) {
          return;
        }
        var cn = att.getParameter('cn');
        var mail = calendarUtils.removeMailto(id);
        var partstat = att.getParameter('partstat');
        var data = {
          fullmail: calendarUtils.fullmailOf(cn, mail),
          mail: mail,
          name: cn || mail,
          partstat: partstat,
          displayName: cn || mail
        };

        // We will only handle these three cases
        if (partstat !== 'ACCEPTED' && partstat !== 'DECLINED' && partstat !== 'NEEDS-ACTION') {
          partstat = 'OTHER';
        }

        attendeesPerPartstat[partstat] = attendeesPerPartstat[partstat] || [];
        attendeesPerPartstat[partstat].push(data);
        attendees.push(data);
      });

      var organizer = vevent.getFirstProperty('organizer');
      if (organizer) {
        var mail = calendarUtils.removeMailto(organizer.getFirstValue());
        var cn = organizer.getParameter('cn');
        this.organizer = {
          fullmail: calendarUtils.fullmailOf(cn, mail),
          mail: mail,
          name: cn || mail,
          displayName: cn || mail
        };
      }

      // NOTE: changing any of the above properties won't update the vevent, or
      // vice versa.
      this.vcalendar = vcalendar;
      this.path = path;
      this.etag = etag;
    }

    function getCaldavServerURL() {
      if (serverUrlCache) {
        return serverUrlCache.promise;
      }

      serverUrlCache = $q.defer();
      CalendarRestangular.one('info').get().then(
        function(response) {
          serverUrlCache.resolve(response.data.url);
        },
        function(err) {
          serverUrlCache.reject(err);
        }
      );

      return serverUrlCache.promise;
    }

    function configureRequest(method, path, headers, body) {
      return $q.all([tokenAPI.getNewToken(), getCaldavServerURL()]).then(function(results) {
        var token = results[0].data.token, url = results[1];

        headers = headers || {};
        headers.ESNToken = token;

        var config = {
          url: url.replace(/\/$/, '') + path,
          method: method,
          headers: headers
        };

        if (body) {
          config.data = body;
        }

        return config;
      });
    }

    function request(method, path, headers, body) {
      return configureRequest(method, path, headers, body).then(function(config) {
        return $http(config);
      });
    }

      var timezoneLocal = this.timezoneLocal || jstz.determine().name();

    function shellToICAL(shell) {
      var uid = shell.id || uuid4.generate();
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', uid);
      vevent.addPropertyWithValue('summary', shell.title);

      var dtstart = ICAL.Time.fromJSDate(shell.start.toDate());
      var dtend = ICAL.Time.fromJSDate(shell.end.toDate());

      dtstart.isDate = shell.allDay;
      dtend.isDate = shell.allDay;

      if (shell.organizer) {
        var organizer = vevent.addPropertyWithValue('organizer', calendarUtils.prependMailto(shell.organizer.mail || shell.organizer.emails[0]));
        organizer.setParameter('cn', shell.organizer.displayName || calendarUtils.diplayNameOf(shell.organizer.firstname, shell.organizer.lastname));
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
          var mail = angular.isArray(attendee.emails) ? attendee.emails[0] : attendee.mail;
          var mailto = calendarUtils.prependMailto(mail);
          var property = vevent.addPropertyWithValue('attendee', mailto);
          property.setParameter('partstat', ICAL_PROPERTIES.partstat.needsaction);
          property.setParameter('rsvp', ICAL_PROPERTIES.rsvp.true);
          property.setParameter('role', ICAL_PROPERTIES.role.reqparticipant);
          property.setParameter('cn', attendee.displayName);
        });
      }

      vcalendar.addSubcomponent(vevent);
      return vcalendar;
    }

    function icalToShell(ical) {
      return new CalendarShell(new ICAL.Component(ical));
    }

    function getInvitedAttendees(vcalendar, emails) {
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      var attendees = vevent.getAllProperties('attendee');
      var organizer = vevent.getFirstProperty('organizer');
      var organizerId = organizer && organizer.getFirstValue().toLowerCase();

      var emailMap = Object.create(null);
      emails.forEach(function(email) { emailMap[calendarUtils.prependMailto(email.toLowerCase())] = true; });

      var invitedAttendees = [];
      for (var i = 0; i < attendees.length; i++) {
        if (attendees[i].getFirstValue().toLowerCase() in emailMap) {
          invitedAttendees.push(attendees[i]);
        }
      }

      // We also need the organizer to work around an issue in Lightning
      if (organizer && organizerId in emailMap) {
        invitedAttendees.push(organizer);
      }
      return invitedAttendees;
    }

    function getEvent(path) {
      var headers = { Accept: 'application/calendar+json' };
      return request('get', path, headers).then(function(response) {
        var vcalendar = new ICAL.Component(response.data);
        return new CalendarShell(vcalendar, path, response.headers('ETag'));
      });
    }

    function list(calendarPath, start, end, timezone) {
      var req = {
        match: {
          start: moment(start).format('YYYYMMDD[T]HHmmss'),
          end: moment(end).format('YYYYMMDD[T]HHmmss')
        },
        scope: {
          calendars: [calendarPath]
        }
      };

      return request('post', '/json/queries/time-range', null, req).then(function(response) {
        return response.data.map(function(vcaldata) {
          var vcalendar = new ICAL.Component(vcaldata);
          return new CalendarShell(vcalendar);
        });
      });
    }

    function create(calendarPath, vcalendar) {
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      if (!vevent) {
        return $q.reject(new Error('Missing VEVENT in VCALENDAR'));
      }
      var uid = vevent.getFirstPropertyValue('uid');
      if (!uid) {
        return $q.reject(new Error('Missing UID in VEVENT'));
      }

      var eventPath = calendarPath.replace(/\/$/, '') + '/' + uid + '.ics';
      var headers = { 'Content-Type': 'application/calendar+json' };
      var body = vcalendar.toJSON();

      return request('put', eventPath, headers, body).then(function(response) {
        if (response.status !== 201) {
          return $q.reject(response);
        }
        $rootScope.$emit('addedCalendarItem', new CalendarShell(vcalendar));
        return response;
      });
    }

    function remove(calendarPath, event, etag) {

      var headers = {};
      if (etag) {
        headers['If-Match'] = etag;
      }
      var eventPath = calendarPath.replace(/\/$/, '') + '/' + event.id + '.ics';
      return request('delete', eventPath, headers).then(function(response) {
        if (response.status !== 204) {
          return $q.reject(response);
        }
        $rootScope.$emit('removedCalendarItem', event.id);

        return response;
      });
    }

    function modify(eventPath, event, etag) {
      var headers = {
        'Content-Type': 'application/calendar+json',
        'Prefer': 'return-representation'
      };
      var body = shellToICAL(event).toJSON();

      if (etag) {
        headers['If-Match'] = etag;
      }

      return request('put', eventPath, headers, body).then(function(response) {
        if (response.status === 200) {
          var vcalendar = new ICAL.Component(response.data);
          return new CalendarShell(vcalendar, eventPath, response.headers('ETag'));
        } else if (response.status === 204) {
          $rootScope.$emit('modifiedCalendarItem', event);
          socket('/calendars').emit('event:updated', shellToICAL(event));
          return getEvent(eventPath);
        } else {
          return $q.reject(response);
        }
      });
    }

    function changeParticipation(eventPath, event, emails, status, etag) {
      var vcalendar = shellToICAL(event);
      var atts = getInvitedAttendees(vcalendar, emails);
      var needsModify = false;
      atts.forEach(function(att) {
        if (att.getParameter('partstat') !== status) {
          att.setParameter('partstat', status);
          needsModify = true;
        }
      });
      if (!atts.length || !needsModify) {
        return $q.when(null);
      }

      return modify(eventPath, event, etag)['catch'](function(response) {
        if (response.status === 412) {
          return getEvent(eventPath).then(function(shell) {
            // A conflict occurred. We've requested the event data in the
            // response, so we can retry the request with this data.
            return changeParticipation(eventPath, shell, emails, status, shell.etag);
          });
        } else {
          return $q.reject(response);
        }
      });
    }

    var serverUrlCache = null;
    return {
      list: list,
      create: create,
      remove: remove,
      modify: modify,
      changeParticipation: changeParticipation,
      getEvent: getEvent,
      shellToICAL: shellToICAL,
      icalToShell: icalToShell,
      timezoneLocal: timezoneLocal,
      getInvitedAttendees: getInvitedAttendees
    };
  }])

  .service('eventService', ['session', 'ICAL_PROPERTIES', 'ICAL', function(session, ICAL_PROPERTIES, ICAL) {
    function render(event, element) {
      element.find('.fc-content').addClass('ellipsis');

      if (event.location) {
        var contentElement = element.find('.fc-title');
        contentElement.addClass('ellipsis');
        var contentHtml = contentElement.html() + ' (' + event.location + ')';
        contentElement.html(contentHtml);
      }

      if (event.description) {
        element.attr('title', event.description);
      }

      var sessionUserAsAttendee = [];
      if (event.attendeesPerPartstat[ICAL_PROPERTIES.partstat.needsaction]) {
        sessionUserAsAttendee = event.attendeesPerPartstat[ICAL_PROPERTIES.partstat.needsaction].filter(function(attendee) {
          return attendee.mail === session.user.emails[0];
        });
      }

      if (sessionUserAsAttendee[0]) {
        element.addClass('event-needs-action');
      } else {
        element.addClass('event-accepted');
      }

      element.addClass('event-common');
    }

    function copyNonStandardProperties(src, dest) {

      dest.location = src.location;
      dest.description = src.description;
      if (src.attendees) {
        dest.attendees = src.attendees;
      }
      if (src.attendeesPerPartstat) {
        dest.attendeesPerPartstat = src.attendeesPerPartstat;
      }
    }

    function copyEventObject(src, dest) {

      var vcal;
      if (src.vcalendar) {
        vcal = ICAL.helpers.clone(src.vcalendar);
        src.vcalendar = null;
      }
      angular.copy(src, dest);
      if (vcal) {
        src.vcalendar = vcal;
        dest.vcalendar = vcal;
      }
    }

    return {
      render: render,
      copyNonStandardProperties: copyNonStandardProperties,
      copyEventObject: copyEventObject
    };

  }])

  .service('calendarUtils', function(moment) {
    /**
     * Prepend a mail with 'mailto:'
     * @param {String} mail
     */
    function prependMailto(mail) {
      return 'mailto:' + mail;
    }

    /**
     * Remove (case insensitive) mailto: prefix
     * @param {String} mail
     */
    function removeMailto(mail) {
      return mail.replace(/^mailto:/i, '');
    }

    /**
     * Build and return a fullname like: John Doe <john.doe@open-paas.org>
     * @param {String} cn
     * @param {String} mail
     */
    function fullmailOf(cn, mail) {
      return cn ? cn + ' <' + mail + '>' : mail;
    }

    /**
     * Build and return a displayName: 'firstname lastname'
     * @param {String} firstname
     * @param {String} lastname
     */
    function displayNameOf(firstname, lastname) {
      return firstname + ' ' + lastname;
    }

    /**
     * Return a moment representing (the next hour) starting from Date.now()
     */
    function getNewStartDate() {
      return moment().endOf('hour').add(1, 'seconds');
    }

    /**
     * Return a moment representing (the next hour + 1 hour) starting from Date.now()
     */
    function getNewEndDate() {
      return getNewStartDate().add(1, 'hours');
    }

    /**
     * Return true if start is the same day than end
     * @param {Date} start
     * @param {Date} end
     */
    function isSameDay(start, end) {
      return start.isSame(end, 'day');
    }

    /**
     * When selecting a single cell, ensure that the end date is 1 hours more than the start date at least.
     * @param {Date} start
     * @param {Date} end
     */
    function getDateOnCalendarSelect(start, end) {
      if (end.diff(start, 'minutes') === 30) {
        var newStart = start.startOf('hour');
        var newEnd = moment(newStart).add(1, 'hours');
        return { start: newStart, end: newEnd };
      } else {
        return { start: start, end: end };
      }
    }

    return {
      prependMailto: prependMailto,
      removeMailto: removeMailto,
      fullmailOf: fullmailOf,
      diplayNameOf: displayNameOf,
      getNewStartDate: getNewStartDate,
      getNewEndDate: getNewEndDate,
      isSameDay: isSameDay,
      getDateOnCalendarSelect: getDateOnCalendarSelect
    };
  })

  .service('localEventSource', function() {
    var events = [];

    function getEvents(start, end, timezone, callback) {
      return callback(events);
    }

    function addEvent(newEvent) {
      var oldVersion = null;
      events = events.map(function(event) {
        if (event.id === newEvent.id) {
          oldVersion = event;
          return newEvent;
        }
        return event;
      });
      if (!oldVersion) {
        events.push(newEvent);
      }
      return oldVersion;
    }

    return {
      getEvents: getEvents,
      addEvent: addEvent
    };
  });
