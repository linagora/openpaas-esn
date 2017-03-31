'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The events-providers', function() {

  var $rootScope, calEventsProviders, $httpBackend, calendarService, searchProvidersMock, CAL_EVENTS;
  var calendarHomeId = 'calendarHomeId';

  beforeEach(function() {
    searchProvidersMock = {
      add: sinon.spy(),
      remove: sinon.spy()
    };

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('calendarHomeService', {
        getUserCalendarHomeId: function() {
          return $q.when(calendarHomeId);
        }
      });

      $provide.value('searchProviders', searchProvidersMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$httpBackend_, _calEventsProviders_, _calendarService_, _CAL_EVENTS_) {
    $rootScope = _$rootScope_;
    calEventsProviders = _calEventsProviders_;
    $httpBackend = _$httpBackend_;
    calendarService = _calendarService_;
    CAL_EVENTS = _CAL_EVENTS_;
  }));

  describe('The setUpSearchProviders', function() {
    it('should add a promise on calendar\'s provider', function() {
      calEventsProviders.setUpSearchProviders();
      expect(searchProvidersMock.add).to.have.been.calledWith(sinon.match({then: sinon.match.truthy}));
    });

    describe('', function() {
      beforeEach(function() {
        $rootScope.$on = sinon.spy();
      });

      it('should listen to CAL_EVENTS.CALENDARS.REMOVE and remove the appopriate provider', function() {
        calEventsProviders.setUpSearchProviders();
        expect($rootScope.$on).to.have.been.calledWith(CAL_EVENTS.CALENDARS.REMOVE, sinon.match.func.and(sinon.match(function(callback) {
          callback(null, {id: 'id'});
          expect(searchProvidersMock.remove).to.have.been.calledWith(sinon.match.func.and(sinon.match(function(callback) {
            return callback({id: 'id'}) && !callback({id: 'id2'});
          })));

          return true;
        })));
      });

      it('should listen to CAL_EVENTS.CALENDARS.ADD and add a provider for the calendar', function() {
        calEventsProviders.setUpSearchProviders();
        expect($rootScope.$on).to.have.been.calledWith(CAL_EVENTS.CALENDARS.ADD, sinon.match.func);
      });
    });
  });

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

      calEventsProviders.getAll().then(function(providers) {
        providers.forEach(testEventProvider);
      }, done);
      $rootScope.$digest();
      $httpBackend.flush();
    });

    it('should prevent error when sabre is down', function(done) {
      calendarService.listCalendars = function() {
        return $q.reject();
      };

      calEventsProviders.getAll().then(function(providers) {
        expect(providers).to.deep.equal([]);
        done();
      }, done);
      $rootScope.$digest();
    });
  });
});
