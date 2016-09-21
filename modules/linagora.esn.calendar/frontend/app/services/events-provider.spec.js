'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The events-providers', function() {

  var $rootScope, eventsProviders, $httpBackend, calendarService;
  var calendarHomeId = 'calendarHomeId';

  beforeEach(function() {
    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('calendarHomeService', {
        getUserCalendarHomeId: function() {
          return $q.when(calendarHomeId);
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$httpBackend_, _eventsProviders_, _calendarService_) {
    $rootScope = _$rootScope_;
    eventsProviders = _eventsProviders_;
    $httpBackend = _$httpBackend_;
    calendarService = _calendarService_;
  }));

  describe('The getAll function', function() {

    it('should build providers for each calendar which request events from the backend, return pages of events and paginate next request', function(done) {
      var calendarIds = ['calendar1', 'calendar2'];

      function testEventProvider(provider, index) {
        var davItems = [{
          _links: {
            self: { href: '/prepath/path/to/calendar/myuid.ics' }
          },
          etag: '"123123"',
          data: 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nEND:VEVENT\r\nEND:VCALENDAR'
        }];

        var fetcher = provider.fetch('abcd');
        var firstFetchSpy = function(events) {
          expect(events.length).to.equal(1);
          events.forEach(function(event) {
            expect(event).to.have.ownProperty('date');
          });
          if (index === 1) {
            done();
          }
        };

        $httpBackend.expectGET('/calendar/api/calendars/' + calendarIds[index] + '/events.json?limit=200&offset=0&query=abcd').respond(200, {
          _links: {
            self: { href: '/prepath/path/to/calendar.json' }
          },
          _embedded: {
            'dav:item': davItems
          }
        });

        fetcher().then(firstFetchSpy, done);
      }

      var davCalendars = calendarIds.map(function(calendarId) {
        return {
          _links: {
            self: { href: calendarId }
          }
        };
      });

      $httpBackend.expectGET('/dav/api/calendars/' + calendarHomeId + '.json').respond(200, {
        _embedded: {
          'dav:calendar': davCalendars
        }
      });

      eventsProviders.getAll().then(function(providers) {
        providers.forEach(testEventProvider);
      }, done);
      $rootScope.$digest();
      $httpBackend.flush();
    });

    it('should prevent error when sabre is down', function(done) {
      calendarService.listCalendars = function() {
        return $q.reject();
      };

      eventsProviders.getAll().then(function(providers) {
        expect(providers).to.deep.equal([]);
        done();
      }, done);
      $rootScope.$digest();
    });
  });
});
