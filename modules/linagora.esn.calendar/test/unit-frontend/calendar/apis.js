'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calendar module apis', function() {

  var vcalendar = {
    toJSON: function() {}
  };

  var data = {
    match: {start: '20140101T000000', end: '20140102T000000'}
  };

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function($httpBackend, moment, calendarAPI, eventAPI) {
      this.$httpBackend = $httpBackend;
      this.moment = moment;
      this.calendarAPI = calendarAPI;
      this.eventAPI = eventAPI;
    });
  });

  describe('calendarAPI', function() {

    describe('listEvents request', function() {

      it('should request the correct path and return an array of items included in dav:item', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:item': [{
              '_links': {
                'self': { 'href': '/prepath/path/to/calendar/myuid.ics' }
              },
              'etag': '"123123"',
              'data': [
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
            }]
          }
        });

        this.calendarAPI.listEvents('test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([{
              '_links': {
                'self': { 'href': '/prepath/path/to/calendar/myuid.ics' }
              },
              'etag': '"123123"',
              'data': [
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
            }]);
          });
      });

      it('should return an empty array if response.data is not defined', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond(null);
        this.calendarAPI.listEvents('test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded is not defined', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': null
        });
        this.calendarAPI.listEvents('test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded[\'dav:item\'] is not defined', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:item': null
          }
        });

        this.calendarAPI.listEvents('test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an Error if response.status is not 200', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond(500, 'Error');
        this.calendarAPI.listEvents('test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('listEventsForCalendar request', function() {
      var data = {
        match: {start: '20140101T000000', end: '20140102T000000'}
      };

      it('should request the correct path and return an array of items included in dav:item', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/subtest.json', data).respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:item': [{
              '_links': {
                'self': { 'href': '/prepath/path/to/calendar/myuid.ics' }
              },
              'etag': '"123123"',
              'data': [
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
            }]
          }
        });

        this.calendarAPI.listEventsForCalendar('subtest', 'test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([{
              '_links': {
                'self': { 'href': '/prepath/path/to/calendar/myuid.ics' }
              },
              'etag': '"123123"',
              'data': [
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
            }]);
          });
      });

      it('should return an empty array if response.data is not defined', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/subtest.json', data).respond(null);
        this.calendarAPI.listEventsForCalendar('subtest', 'test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded is not defined', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/subtest.json', data).respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': null
        });
        this.calendarAPI.listEventsForCalendar('subtest', 'test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded[\'dav:item\'] is not defined', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/subtest.json', data).respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:item': null
          }
        });

        this.calendarAPI.listEventsForCalendar('subtest', 'test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an Error if response.status is not 200', function() {
        this.$httpBackend.expectPOST('/dav/api/calendars/test/subtest.json', data).respond(500, 'Error');
        this.calendarAPI.listEventsForCalendar('subtest', 'test', this.moment('20140101T000000'), this.moment('20140102T000000'))
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('listAllCalendars request', function() {
      it('should request the correct path and return an array of items included in dav:home', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:home': ['dav:calendar']
          }
        });

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal(['dav:calendar']);
          });
      });

      it('should return an empty array if response.data is not defined', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond(null);

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded is not defined', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': null
        });

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded[\'dav:home\'] is not defined', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:home': null
          }
        });

        this.calendarAPI.listAllCalendars()
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an Error if response.status is not 200', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/.json').respond(500, 'Error');

        this.calendarAPI.listAllCalendars()
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('listCalendars request', function() {
      it('should request the correct path and return an array of items included in dav:calendar', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:calendar': ['dav:calendar']
          }
        });

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal(['dav:calendar']);
          });
      });

      it('should return an empty array if response.data is not defined', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond(null);

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded is not defined', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': null
        });

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an empty array if response.data._embedded[\'dav:calendar\'] is not defined', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond({
          '_links': {
            'self': { 'href': '/prepath/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:calendar': null
          }
        });

        this.calendarAPI.listCalendars('test')
          .then(function(data) {
            expect(data).to.deep.equal([]);
          });
      });

      it('should return an Error if response.status is not 200', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test.json').respond(500, 'Error');

        this.calendarAPI.listCalendars('test')
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('createCalendar request', function() {
      it('should return the http response if response.status is 201', function() {
        var vcalendar = {
          toJSON: function() {}
        };
        this.$httpBackend.expectPOST('/dav/api/calendars/test.json', vcalendar).respond(201, 'aResponse');

        this.calendarAPI.createCalendar('test', vcalendar)
          .then(function(response) {
            expect(response).to.deep.equal('aResponse');
          });
      });

      it('should return an Error if response.status is not 201', function() {
        var vcalendar = {
          toJSON: function() {}
        };
        this.$httpBackend.expectPOST('/dav/api/calendars/test.json', vcalendar).respond(500, 'Error');

        this.calendarAPI.createCalendar('test', vcalendar)
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });
  });

  describe('eventAPI', function() {
    describe('get request', function() {
      it('should return the http response if status is 200', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test', vcalendar).respond(200, 'aResponse');

        this.eventAPI.get('test', vcalendar)
          .then(function(response) {
            expect(response).to.deep.equal('aResponse');
          });
      });

      it('should return an Error if response.status is not 200', function() {
        this.$httpBackend.expectGET('/dav/api/calendars/test', vcalendar).respond(500, 'Error');

        this.eventAPI.get('test', vcalendar)
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('create request', function() {
      it('should return an id if status is 202 and graceperiod is true', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(202, { data: {id: 'anId'} });

        this.eventAPI.create('test', vcalendar, {graceperiod: true})
          .then(function(response) {
            expect(response).to.deep.equal('anId');
          });
      });

      it('should return an Error if response.status is not 202 and graceperiod is true', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(500, 'Error');

        this.eventAPI.create('test', vcalendar, {graceperiod: true})
          .catch (function(err) {
            expect(err).to.exist;
          });
      });

      it('should return a http response if status is 201 and graceperiod is false', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(201, 'aReponse');

        this.eventAPI.create('test', vcalendar, {graceperiod: false})
          .then(function(response) {
            expect(response).to.deep.equal('aReponse');
          });
      });

      it('should return an Error if response.status is not 201 and graceperiod is true', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(500, 'Error');

        this.eventAPI.create('test', vcalendar, {graceperiod: false})
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('modify request', function() {
      it('should return an id if status is 202', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(202, { data: {id: 'anId'} });

        this.eventAPI.modify('test', vcalendar, 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('anId');
          });
      });

      it('should return an Error if response.status is not 202', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(500, 'Error');

        this.eventAPI.modify('test', vcalendar, 'etag')
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('remove request', function() {
      it('should return an id if status is 202', function() {
        this.$httpBackend.expectDELETE('/dav/api/calendars/test.json', vcalendar).respond(202, { data: {id: 'anId'} });

        this.eventAPI.remove('test', 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('anId');
          });
      });

      it('should return an Error if response.status is not 202', function() {
        this.$httpBackend.expectDELETE('/dav/api/calendars/test.json', vcalendar).respond(500, 'Error');

        this.eventAPI.remove('test', 'etag')
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });

    describe('changeParticipation request', function() {
      it('should return a http response if status is 200', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(200, 'aResponse');

        this.eventAPI.changeParticipation('test', vcalendar, 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('aResponse');
          });
      });

      it('should return a http response if status is 204', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(204, 'aResponse');

        this.eventAPI.changeParticipation('test', vcalendar, 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('aResponse');
          });
      });

      it('should return an Error if response.status is not 200 and not 204', function() {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', vcalendar).respond(500, 'Error');

        this.eventAPI.changeParticipation('test', vcalendar, 'etag')
          .catch (function(err) {
            expect(err).to.exist;
          });
      });
    });
  });
});
