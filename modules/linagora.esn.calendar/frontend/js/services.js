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
  .factory('dateService', ['moment', function(moment) {

    function getNewDate() {
      return moment().endOf('hour').add(1, 'minutes').toDate();
    }

    function getNewEndDate() {
      return moment(getNewDate()).add(1, 'hours').toDate();
    }

    function isSameDay(startDate, endDate) {
      return moment(startDate).isSame(moment(endDate));
    }
    return {
      getNewDate: getNewDate,
      getNewEndDate: getNewEndDate,
      isSameDay: isSameDay
    };
  }])
  .factory('calendarService', ['CalendarRestangular', '$rootScope', 'moment', 'tokenAPI', 'uuid4', 'ICAL', '$q', '$http', function(CalendarRestangular, $rootScope, moment, tokenAPI, uuid4, ICAL, $q, $http) {

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
      this.start = vevent.getFirstPropertyValue('dtstart').toJSDate();
      this.end = vevent.getFirstPropertyValue('dtend').toJSDate();

      var start = moment(this.start);
      var end = moment(this.end);
      this.formattedDate = start.format('MMMM D, YYYY');
      this.formattedStartTime = start.format('h');
      this.formattedStartA = start.format('a');
      this.formattedEndTime = end.format('h');
      this.formattedEndA = end.format('a');

      var attendees = this.attendees = {};

      vevent.getAllProperties('attendee').forEach(function(att) {
        var id = att.getFirstValue();
        if (!id) {
          return;
        }
        var cn = att.getParameter('cn');
        var mail = id.replace(/^mailto:/, '');
        var partstat = att.getParameter('partstat');
        var data = {
          fullmail: (cn ? cn + ' <' + mail + '>' : mail),
          mail: mail,
          name: cn || mail,
          partstat: partstat
        };

        // We will only handle these three cases
        if (partstat !== 'ACCEPTED' && partstat !== 'DECLINED') {
          partstat = 'OTHER';
        }

        attendees[partstat] = attendees[partstat] || [];
        attendees[partstat].push(data);
      });

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

    function shellToICAL(shell) {
      var uid = uuid4.generate();
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', uid);
      vevent.addPropertyWithValue('summary', shell.title);

      var dtstart = ICAL.Time.fromJSDate(shell.startDate);
      var dtend = ICAL.Time.fromJSDate(shell.endDate);
      dtstart.isDate = shell.allday;
      dtend.isDate = shell.allday;

      if (shell.allday) {
        dtend.day++;
      }

      vevent.addPropertyWithValue('dtstart', dtstart);
      vevent.addPropertyWithValue('dtend', dtend);
      vevent.addPropertyWithValue('transp', shell.allday ? 'TRANSPARENT' : 'OPAQUE');
      if (shell.location) {
        vevent.addPropertyWithValue('location', shell.location);
      }
      if (shell.description) {
        vevent.addPropertyWithValue('description', shell.description);
      }
      vcalendar.addSubcomponent(vevent);
      return vcalendar;
    }

    function getInvitedAttendees(vcalendar, emails) {
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      var attendees = vevent.getAllProperties('attendee');
      var organizer = vevent.getFirstProperty('organizer');
      var organizerId = organizer && organizer.getFirstValue().toLowerCase();

      var emailMap = Object.create(null);
      emails.forEach(function(email) { emailMap['mailto:' + email.toLowerCase()] = true; });

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
        $rootScope.$emit('addedEvent', new CalendarShell(vcalendar));
        return response;
      });
    }

    function modify(eventPath, vcalendar, etag) {
      var headers = {
        'Content-Type': 'application/json+calendar',
        'Prefer': 'return-representation'
      };
      var body = vcalendar.toJSON();

      if (etag) {
        headers['If-Match'] = etag;
      }

      return request('put', eventPath, headers, body).then(function(response) {
        if (response.status === 200) {
          var vcalendar = new ICAL.Component(response.data);
          return new CalendarShell(vcalendar, eventPath, response.headers('ETag'));
        } else if (response.status === 204) {
          return getEvent(eventPath);
        } else {
          return $q.reject(response);
        }
      });
    }

    function changeParticipation(eventPath, vcalendar, emails, status, etag) {
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

      return modify(eventPath, vcalendar, etag)['catch'](function(response) {
        if (response.status === 412) {
          return getEvent(eventPath).then(function(shell) {
            // A conflict occurred. We've requested the event data in the
            // response, so we can retry the request with this data.
            return changeParticipation(eventPath, shell.vcalendar, emails, status, shell.etag);
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
      modify: modify,
      changeParticipation: changeParticipation,
      getEvent: getEvent,
      shellToICAL: shellToICAL,
      getInvitedAttendees: getInvitedAttendees
    };
  }]);
