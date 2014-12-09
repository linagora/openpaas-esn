'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module', function() {

  describe('The calendarService service', function() {
    beforeEach(function() {
      var self = this;
      this.tokenAPI = {
        getNewToken: function() {
          return {
            then: function(callback) {
              self.tokenAPI.callback = callback;
            }
          };
        }
      };

      angular.mock.module('esn.calendar');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
      });
    });

    beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.calendarService = calendarService;
    }));

    describe('The list fn', function() {
      it('should list events', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        var data = {
          match: { start: '20140101T000000', end: '20140102T000000' },
          scope: { calendars: ['/path/to/calendar'] }
        };
        this.$httpBackend.expectPOST('/json/queries/time-range', data).respond([
          ['vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'myuid'],
              ['summary', {}, 'text', 'title'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
            ], []]
          ]]
        ]);

        var start = new Date(2014, 0, 1);
        var end = new Date(2014, 0, 2);

        this.calendarService.list('/path/to/calendar', start, end, false).then(function(events) {
            expect(events).to.be.an.array;
            expect(events.length).to.equal(1);
            expect(events[0].id).to.equal('myuid');
            expect(events[0].title).to.equal('title');
            expect(events[0].start.getTime()).to.equal(new Date(2014, 0, 1, 2, 3, 4).getTime());
            expect(events[0].end.getTime()).to.equal(new Date(2014, 0, 1, 3, 3, 4).getTime());
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });
    });

    describe('The getEvent fn', function() {
      it('should return an event', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/caldavserver').respond({data: { url: ''}});

        // The caldav server will be hit
        this.$httpBackend.expectGET('/path/to/event.ics').respond(
          ['vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'myuid'],
              ['summary', {}, 'text', 'title'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
            ], []]
          ]]
        );

        this.calendarService.getEvent('path/to/event.ics').then(function(event) {
            expect(event).to.be.an('object');
            expect(event.id).to.equal('myuid');
            expect(event.title).to.equal('title');
            expect(event.start.getTime()).to.equal(new Date(2014, 0, 1, 2, 3, 4).getTime());
            expect(event.end.getTime()).to.equal(new Date(2014, 0, 1, 3, 3, 4).getTime());
            expect(event.vevent).to.exist;
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.tokenAPI.callback({ data: { token: '123' } });
        this.$httpBackend.flush();
      });
    });
  });
});
