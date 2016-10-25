'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calendarEventSource', function() {
  beforeEach(function() {

    this.tokenAPI = {
      _token: '123',
      getNewToken: function() {
        var token = this._token;

        return $q.when({data: {token: token}});
      }
    };

    var self = this;

    angular.mock.module('linagora.esn.graceperiod');
    angular.mock.module('esn.calendar');
    angular.mock.module('esn.ical');
    angular.mock.module(function($provide) {
      $provide.value('tokenAPI', self.tokenAPI);
    });
  });

  it('should use the correct path', function(done) {
    angular.mock.inject(function(calendarEventSource, $httpBackend, calMoment) {
      this.$httpBackend = $httpBackend;
      this.calendarEventSource = calendarEventSource;
      this.calMoment = calMoment;
    });

    var data = {
      match: {start: '20140101T000000', end: '20140102T000000'}
    };
    this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', data).respond({
      _links: {self: {href: '/prepath/path/to/calendar.json'}},
      _embedded: {'dav:item': []}
    });

    var start = this.calMoment(new Date(2014, 0, 1));
    var end = this.calMoment(new Date(2014, 0, 2));

    var source = this.calendarEventSource('/dav/api/calendars/test/events.json', function() {
    });

    source(start, end, false, function() {
      // Just getting here is fine, the http backend will check for the
      // right URL.
      done();
    });
    this.$httpBackend.flush();
  });

  it('should filter cancelled events', function(done) {
    angular.mock.inject(function(calendarEventSource, $httpBackend, calMoment) {
      this.$httpBackend = $httpBackend;
      this.calendarEventSource = calendarEventSource;
      this.calMoment = calMoment;
    });

    var data = {
      match: {start: '20140101T000000', end: '20140102T000000'}
    };
    this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', data).respond({
      _links: {
        self: { href: '/prepath/path/to/calendar.json' }
      },
      _embedded: {
        'dav:item': [{
          _links: {
            self: { href: '/prepath/path/to/calendar/myuid.ics' }
          },
          etag: '"123123"',
          data: [
            'vcalendar', [], [
              ['vevent', [
                ['uid', {}, 'text', 'myuid'],
                ['summary', {}, 'text', 'title'],
                ['location', {}, 'text', 'location'],
                ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
                ['dtend', {}, 'date-time', '2014-01-01T03:03:04'],
                ['status', {}, 'text', 'CANCELLED']
              ], []]
            ]
          ]
        }]
      }
    });

    var start = this.calMoment(new Date(2014, 0, 1));
    var end = this.calMoment(new Date(2014, 0, 2));

    var source = this.calendarEventSource('/dav/api/calendars/test/events.json');

    source(start, end, false, function(events) {
      expect(events).to.deep.equal([]);
      done();
    });
    this.$httpBackend.flush();
  });

  it('should propagate an error if calendar events cannot be retrieved', function(done) {

    var start = this.calMoment('2015-01-01 09:00:00');
    var end = this.calMoment('2015-01-01 09:30:00');
    var calendarId = 'test';
    var localTimezone = 'local';

    angular.mock.module(function($provide) {
      $provide.factory('calEventService', function() {
        return {
          listEvents: function(id, startMoment, endMoment, timezone) {
            expect(id).to.equals('test');
            expect(startMoment).to.deep.equal(start);
            expect(endMoment).to.deep.equal(end);
            expect(timezone).to.equals(localTimezone);

            return $q.reject('');
          }
        };
      });
    });

    angular.mock.inject(function(calendarEventSource, $rootScope) {
      this.calendarEventSource = calendarEventSource;
      this.$rootScope = $rootScope;
    });

    var noErrorsCallback = function(events) {
      expect(events).to.deep.equal([]);
    };

    var displayCalendarErrorMock = function(errorObject, errorMessage) { // eslint-disable-line
      expect(errorMessage).to.equal('Can not get calendar events');
      done();
    };

    var factoryForCalendarEvents = this.calendarEventSource(calendarId, displayCalendarErrorMock);

    factoryForCalendarEvents(start, end, localTimezone, noErrorsCallback);
    this.$rootScope.$apply();
  });
});
