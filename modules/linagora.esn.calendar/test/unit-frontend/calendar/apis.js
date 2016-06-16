'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar module apis', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function($httpBackend, fcMoment, calendarAPI, eventAPI, CALENDAR_CONTENT_TYPE_HEADER, CALENDAR_ACCEPT_HEADER, CALENDAR_GRACE_DELAY) {
      this.$httpBackend = $httpBackend;
      this.fcMoment = fcMoment;
      this.calendarAPI = calendarAPI;
      this.eventAPI = eventAPI;
      this.CALENDAR_CONTENT_TYPE_HEADER = CALENDAR_CONTENT_TYPE_HEADER;
      this.CALENDAR_ACCEPT_HEADER = CALENDAR_ACCEPT_HEADER;
      this.CALENDAR_GRACE_DELAY = CALENDAR_GRACE_DELAY;
    });

    var davDateFormat = 'YYYYMMDD[T]HHmmss';

    this.start = this.fcMoment('2014-01-01');
    this.end = this.fcMoment('2014-01-02');
    this.data = {
      match: {start: this.start.format(davDateFormat), end: this.end.format(davDateFormat)}
    };

    this.vcalendar = {
      id: 'id'
    };

  });

  describe('calendarAPI', function() {

    describe('listEvents request', function() {

      it('should request the correct path and return an array of items included in dav:item', function(done) {
        var davItems = [{
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
                ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
              ], []]
            ]
          ]
        }];

        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data).respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:item': davItems
          }
        });

        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal(davItems);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data).respond(null);
        this.calendarAPI.listEvents('/dav/api/calendars/test/events.json', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data).respond({
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
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data).respond({
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
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/events.json', this.data).respond(500, 'Error');
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
        var davItems = [{
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
                ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
              ], []]
            ]
          ]
        }];

        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data).respond({
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:item': davItems
          }
        });

        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal(davItems);
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data).respond(null);

        this.calendarAPI.listEventsForCalendar('test', 'subtest', this.start, this.end)
          .then(function(data) {
            expect(data).to.deep.equal([]);
            done();
          });
        this.$httpBackend.flush();
      });

      it('should return an empty array if response.data._embedded is not defined', function(done) {
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data).respond({
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
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data).respond({
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
        this.$httpBackend.expect('REPORT', '/dav/api/calendars/test/subtest.json', this.data).respond(500, 'Error');
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
    });

    describe('listCalendars request', function() {
      it('should request the correct path and return an array of items included in dav:calendar', function(done) {
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

    describe('createCalendar request', function(done) {

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
  });

  describe('eventAPI', function() {
    beforeEach(function() {
      this.vcalendar.toJSON = angular.identity.bind(null, JSON.stringify(this.vcalendar));
    });

    describe('get request', function() {
      it('should return the http response if status is 200', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test', {Accept: this.CALENDAR_ACCEPT_HEADER}).respond(200, 'aResponse');

        this.eventAPI.get('/dav/api/calendars/test', this.vcalendar)
          .then(function(response) {
            expect(response.data).to.deep.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expectGET('/dav/api/calendars/test', {Accept: this.CALENDAR_ACCEPT_HEADER}).respond(500, 'Error');

        this.eventAPI.get('/dav/api/calendars/test', this.vcalendar)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });

    });

    describe('create request', function() {

      it('should return an id if status is 202 and graceperiod is true', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar).respond(202, {id: 'anId'});

        this.eventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: true})
          .then(function(response) {
            expect(response).to.deep.equal('anId');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 202 and graceperiod is true', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar).respond(500, 'Error');

        this.eventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: true})
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return a http response if status is 201 and graceperiod is false', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar).respond(201, 'aReponse');

        this.eventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: false})
          .then(function(response) {
            expect(response.data).to.equal('aReponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 201 and graceperiod is true', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar).respond(500, 'Error');

        this.eventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: false})
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('modify request', function(done) {
      it('should return an id if status is 202', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar).respond(202, {id: 'anId'});

        this.eventAPI.modify('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('anId');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 202', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar).respond(500, 'Error');

        this.eventAPI.modify('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('getRight method', function() {
      var bodyRequest;

      beforeEach(function() {
        bodyRequest = {
          prop: ['cs:invite', 'acl']
        };
      });

      it('should return an Error if response.status is not 202', function() {
        this.$httpBackend.expect('PROPFIND', '/dav/api/calendars/calendars/id.json', bodyRequest).respond(500, 'Error');

        var catchSpy = sinon.spy();

        this.calendarAPI.getRight('calendars', this.vcalendar).catch(catchSpy);
        this.$httpBackend.flush();
        expect(catchSpy).to.have.been.calledWith(sinon.match({data: 'Error'}));

      });

      it('should return server body response if success', function() {
        this.$httpBackend.expect('PROPFIND', '/dav/api/calendars/calendars/id.json', bodyRequest).respond(200, 'body');

        var catchSpy = sinon.spy();

        this.calendarAPI.getRight('calendars', this.vcalendar).then(catchSpy);
        this.$httpBackend.flush();
        expect(catchSpy).to.have.been.calledWith(sinon.match.same('body'));

      });
    });

    describe('remove request', function() {
      it('should return an id if status is 202', function(done) {
        this.$httpBackend.expectDELETE('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, {'If-Match': 'etag', Accept:'application/json, text/plain, */*' }).respond(202, {id: 'anId'});

        this.eventAPI.remove('/dav/api/calendars/test.json', 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('anId');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 202', function(done) {
        this.$httpBackend.expectDELETE('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, {'If-Match': 'etag', Accept:'application/json, text/plain, */*' }).respond(500, 'Error');

        this.eventAPI.remove('/dav/api/calendars/test.json', 'etag')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('changeParticipation request', function() {
      it('should return a http response if status is 200', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar).respond(200, 'aResponse');

        this.eventAPI.changeParticipation('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .then(function(response) {
            expect(response.data).to.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return a http response if status is 204', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar).respond(204, 'aResponse');

        this.eventAPI.changeParticipation('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .then(function(response) {
            expect(response.data).to.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200 and not 204', function(done) {
        this.$httpBackend.expectPUT('', this.vcalendar).respond(500, 'Error');

        this.eventAPI.changeParticipation('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });
  });
});
