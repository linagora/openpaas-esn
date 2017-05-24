'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The calendarEventSource factory', function() {
  var $rootScope, $q, $httpBackend, calendarEventSource, calendar, href, calMoment, tokenAPI, calEventService, start, end, data;

  beforeEach(function() {
    tokenAPI = {
      _token: '123',
      getNewToken: function() {
        var token = this._token;

        return $q.when({data: {token: token}});
      }
    };

    calEventService = {
      listEvents: sinon.spy(function() {
        return $q.when([]);
      })
    };

    href = '/dav/api/calendars/test/events.json';
    calendar = {
      isSubscription: sinon.spy(function() { return false; }),
      href: href
    };

    angular.mock.module('linagora.esn.graceperiod');
    angular.mock.module('esn.calendar');
    angular.mock.module('esn.ical');
    angular.mock.module(function($provide) {
      $provide.value('tokenAPI', tokenAPI);
      $provide.value('calEventService', calEventService);
    });

    angular.mock.inject(function(_$rootScope_, _$q_, _$httpBackend_, _calMoment_, _calEventService_, _calendarEventSource_) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      $httpBackend = _$httpBackend_;
      calMoment = _calMoment_;
      calEventService = _calEventService_;
      calendarEventSource = _calendarEventSource_;

      start = calMoment(new Date(2014, 0, 1));
      end = calMoment(new Date(2014, 0, 2));
      data = {
        match: {start: '20131231T000000', end: '20140103T000000'}
      };
    });
  });

  it('should use the correct path', function(done) {
    $httpBackend.expect('REPORT', href, data).respond({
      _links: {self: {href: '/prepath/path/to/calendar.json'}},
      _embedded: {'dav:item': []}
    });

    var source = calendarEventSource(calendar, function() {});

    source(start, end, false, function() {
      // Just getting here is fine, the http backend will check for the
      // right URL.
      done();
    });
    $httpBackend.flush();
  });

  it('should fetch source events if calendar is a subscription', function(done) {
    var sourceCal = '/this/is/a/source.json';

    calendar.source = sourceCal;
    calendar.isSubscription = sinon.spy(function() {
      return true;
    });

    $httpBackend.expect('REPORT', sourceCal, data).respond({
      _links: {self: {href: '/prepath/path/to/calendar.json'}},
      _embedded: {'dav:item': []}
    });

    var source = calendarEventSource(calendar, angular.noop);

    source(start, end, false, function() {
      expect(calendar.isSubscription).to.have.been.calledOnce;

      done();
    });

    $httpBackend.flush();
  });

  it('should filter cancelled events', function(done) {
    $httpBackend.expect('REPORT', href, data).respond({
      _links: {
        self: {href: '/prepath/path/to/calendar.json'}
      },
      _embedded: {
        'dav:item': [{
          _links: {
            self: {href: '/prepath/path/to/calendar/myuid.ics'}
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

    var source = calendarEventSource(calendar);

    source(start, end, false, function(events) {
      expect(events).to.deep.equal([]);
      done();
    });
    $httpBackend.flush();
  });

  it('should propagate an error if calendar events cannot be retrieved', function(done) {
    var start = calMoment('2015-01-01 09:00:00');
    var end = calMoment('2015-01-01 09:30:00');
    var startTest = calMoment('2014-12-31 09:00:00');
    var endTest = calMoment('2015-01-02 09:30:00');
    var localTimezone = 'local';

    calEventService.listEvents = function(id, startMoment, endMoment, timezone) {
      expect(id).to.equals(calendar.href);
      expect(startMoment.isSame(startTest)).to.be.true;
      expect(endMoment.isSame(endTest)).to.be.true;
      expect(timezone).to.equals(localTimezone);

      return $q.reject('');
    };

    var noErrorsCallback = function(events) {
      expect(events).to.deep.equal([]);
    };

    var displayCalendarErrorMock = function(errorObject, errorMessage) { // eslint-disable-line
      expect(errorMessage).to.equal('Can not get calendar events');
      done();
    };

    var factoryForCalendarEvents = calendarEventSource(calendar, displayCalendarErrorMock);

    factoryForCalendarEvents(start, end, localTimezone, noErrorsCallback);
    $rootScope.$apply();
  });
});
