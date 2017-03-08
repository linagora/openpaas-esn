'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar module apis', function() {

  var davItem, davItemRecurring, davItems, davItemsRecurring;

  function headerContentTypeJsonChecker(header) {
    return header['Content-Type'] === 'application/json';
  }

  function davItemsResponse(davItems) {
    return {
      _links: {
        self: { href: '/prepath/path/to/calendar.json' }
      },
      _embedded: {
        'dav:item': davItems
      }
    };
  }

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function($httpBackend, calMoment, calendarAPI, calEventAPI, CALENDAR_CONTENT_TYPE_HEADER, CALENDAR_ACCEPT_HEADER, CALENDAR_GRACE_DELAY) {
      this.$httpBackend = $httpBackend;
      this.calMoment = calMoment;
      this.calendarAPI = calendarAPI;
      this.calEventAPI = calEventAPI;
      this.CALENDAR_CONTENT_TYPE_HEADER = CALENDAR_CONTENT_TYPE_HEADER;
      this.CALENDAR_ACCEPT_HEADER = CALENDAR_ACCEPT_HEADER;
      this.CALENDAR_GRACE_DELAY = CALENDAR_GRACE_DELAY;
    });

    var davDateFormat = 'YYYYMMDD[T]HHmmss';

    this.start = this.calMoment('2014-01-01');
    this.end = this.calMoment('2014-01-02');
    this.data = {
      match: {start: this.start.format(davDateFormat), end: this.end.format(davDateFormat)}
    };

    this.vcalendar = {
      id: 'id'
    };

    davItem = {
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
            ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
          ], []]
        ]
      ]
    };
    davItemRecurring = {
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
            ['recurrence-id', {}, 'date-time', '2014-01-01T02:03:04']
          ], []],
          ['vevent', [
            ['uid', {}, 'text', 'myuid'],
            ['summary', {}, 'text', 'title'],
            ['location', {}, 'text', 'location'],
            ['dtstart', {}, 'date-time', '2014-01-02T02:03:04'],
            ['dtend', {}, 'date-time', '2014-01-02T03:03:04'],
            ['recurrence-id', {}, 'date-time', '2014-01-02T02:03:04']
          ], []]
        ]
      ]
    };
    davItems = [davItem];
    davItemsRecurring = [davItemRecurring];
  });

  describe('calendarAPI', function() {

    describe('listEvents request', function() {

      it('should request the correct path and return an array of items included in dav:item', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data, headerContentTypeJsonChecker).respond(davItemsResponse(davItems));

        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal(davItems);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data, headerContentTypeJsonChecker).respond(null);
        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data, headerContentTypeJsonChecker).respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: null
        });
        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded[\'dav:item\'] is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data, headerContentTypeJsonChecker).respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:item': null
          }
        });

        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data, headerContentTypeJsonChecker).respond(500, 'Error');
        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });
        this.$httpBackend.flush();
      });
    });

    describe('listEventsForCalendar request', function() {

      it('should request the correct path and return an array of items included in dav:item', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data, headerContentTypeJsonChecker).respond(davItemsResponse(davItems));

        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal(davItems);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data, headerContentTypeJsonChecker).respond(null);

        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data, headerContentTypeJsonChecker).respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: null
        });
        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded[\'dav:item\'] is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data, headerContentTypeJsonChecker).respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:item': null
          }
        });

        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data, headerContentTypeJsonChecker).respond(500, 'Error');
        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });
        this.$httpBackend.flush();
      });
    });

    describe('listAllCalendars request', function() {
      it('should request the correct path and return an array of items included in dav:home', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:home': ['dav:calendar']
          }
        });

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal(['dav:calendar']);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data is not defined', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond(null);

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded is not defined', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: null
        });

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded[\'dav:home\'] is not defined', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:home': null
          }
        });

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond(500, 'Error');

        this.calendarAPI.listAllCalendars()
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });

      it('should send options when defined as a query parameter', function(done) {
        var options = {
          option1: 'value1',
          option2: 'value2'
        };

        var expectedUrl = '/dav/api/calendars/.json?' + angular.element.param(options);

        this.$httpBackend.expectGET(expectedUrl).respond(null);

        this.calendarAPI.listAllCalendars(options)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('listCalendars request', function() {
      it('should request the correct path without params and return an array of items included in dav:calendar', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:calendar': ['dav:calendar']
          }
        });

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal(['dav:calendar']);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should request the correct path with params and return an array of items included in dav:calendar', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json?withRights=true').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:calendar': ['dav:calendar']
          }
        });

        this.calendarAPI.listCalendars('test', {withRights: true})
          .then(function(data) {
            expect(data).to.deep.equal(['dav:calendar']);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data is not defined', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond(null);

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded is not defined', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: null
        });

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded[\'dav:calendar\'] is not defined', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:calendar': null
          }
        });

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond(500, 'Error');

        this.calendarAPI.listCalendars('test')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('getCalendar request', function() {
      it('should request the correct path and return a dav:calendar', function(done) {
        var davCal = {
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          }
        };

        this.$httpBackend.expectGET('/dav/api/calendars/homeId/id.json').respond(davCal);

        this.calendarAPI.getCalendar('homeId', 'id')
          .then(function(data) {
            expect(data).to.deep.equal(davCal);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/homeId/id.json').respond(500, 'Error');

        this.calendarAPI.getCalendar('homeId', 'id')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('removeCalendar request', function() {
      it('should return the http response if response.status is 204', function() {
        var thenSpy = sinon.spy();

        this.$httpBackend.expectDELETE('/dav/api/calendars/test/cal.json').respond(204, 'aResponse');
        this.calendarAPI.removeCalendar('test', 'cal').then(thenSpy);
        this.$httpBackend.flush();

        expect(thenSpy).to.have.been.calledWith(sinon.match({data: 'aResponse'}));
      });

      it('should return an Error if response.status is not 204', function() {
        var catchSpy = sinon.spy();

        this.$httpBackend.expectDELETE('/dav/api/calendars/test/cal.json').respond(500, 'error');
        this.calendarAPI.removeCalendar('test', 'cal').catch(catchSpy);
        this.$httpBackend.flush();

        expect(catchSpy).to.have.been.calledWith(sinon.match.truthy);
      });
    });

    describe('createCalendar request', function() {

      it('should return the http response if response.status is 201', function(done) {
        this.$httpBackend.expectPOST('/dav/api/calendars/test.json', this.vcalendar).respond(201, 'aResponse');

        this.calendarAPI.createCalendar('test', this.vcalendar)
          .then(function(response) {
            expect(response.data).to.deep.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 201', function(done) {
        this.$httpBackend.expectPOST('/dav/api/calendars/test.json', this.vcalendar).respond(500, 'Error');

        this.calendarAPI.createCalendar('test', this.vcalendar)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('The getEventByUID fn', function() {

      it('should get a non-recurring event', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/home.json', { uid: 'myuid' }).respond(davItemsResponse(davItems));

        this.calendarAPI.getEventByUID('home', 'myuid').then(function(data) {
          expect(data).to.deep.equal(davItems);

          done();
        });

        this.$httpBackend.flush();
      });

      it('should get a recurring event', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/home.json', {uid: 'myuid'}).respond(davItemsResponse(davItemsRecurring));

        this.calendarAPI.getEventByUID('home', 'myuid').then(function(data) {
          expect(data).to.deep.equal(davItemsRecurring);

          done();
        });

        this.$httpBackend.flush();
      });

    });

  });

});
