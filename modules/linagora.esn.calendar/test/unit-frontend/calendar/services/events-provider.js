'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The events-providers', function() {

  var $rootScope, eventsProvider, $httpBackend, ELEMENTS_PER_REQUEST, ELEMENTS_PER_PAGE;

  beforeEach(function() {
    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('session', {
        user: {
          _id: '12345'
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$httpBackend_, _eventsProvider_, _ELEMENTS_PER_REQUEST_, _ELEMENTS_PER_PAGE_) {
    $rootScope = _$rootScope_;
    eventsProvider = _eventsProvider_;
    $httpBackend = _$httpBackend_;
    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
    ELEMENTS_PER_PAGE = _ELEMENTS_PER_PAGE_;
  }));

  describe('The factory', function() {

    function elements(id, length, offset) {
      var array = [], start = offset || 0;

      for (var i = start; i < (start + length); i++) {
        array.push(['vevent', [
          ['uid', {}, 'text', id + i],
          ['summary', {}, 'text', 'title'],
          ['location', {}, 'text', 'location'],
          ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
          ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
        ], []]);
      }

      return array;
    }

    it('should request events from the backend, return pages of events and paginate next request', function(done) {
      var davItems = [{
        _links: {
          self: { href: '/prepath/path/to/calendar/myuid.ics' }
        },
        etag: '"123123"',
        data: [
          'vcalendar', [], elements('events', ELEMENTS_PER_REQUEST)
        ]
      }];
      var fetcher = eventsProvider.fetch('abcd');
      var firstFetchSpy = sinon.spy(function(events) {
        expect(events.length).to.equal(ELEMENTS_PER_PAGE);
        expect(events[0].type).to.deep.equal('Events');
        expect(events[0].uid).to.deep.equal('events0');
      });

      $httpBackend.expectGET('/calendar/api/calendars/12345/events.json?limit=200&offset=0&query=abcd').respond(200, {
        _links: {
          self: { href: '/prepath/path/to/calendar.json' }
        },
        _embedded: {
          'dav:item': davItems
        }
      });

      fetcher().then(firstFetchSpy);
      $httpBackend.flush();

      for (var i = ELEMENTS_PER_PAGE; i < ELEMENTS_PER_REQUEST; i += ELEMENTS_PER_PAGE) {
        fetcher();
        $rootScope.$digest();
      }

      var davItems2 = [{
        _links: {
          self: { href: '/prepath/path/to/calendar/myuid.ics' }
        },
        etag: '"123123"',
        data: [
          'vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'last event !'],
              ['summary', {}, 'text', 'title'],
              ['location', {}, 'text', 'location'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
            ], []]
          ]
        ]
      }];
      $httpBackend.expectGET('/calendar/api/calendars/12345/events.json?limit=200&offset=200&query=abcd').respond(200, {
        _links: {
          self: { href: '/prepath/path/to/calendar.json' }
        },
        _embedded: {
          'dav:item': davItems2
        }
      });
      fetcher().then(function(events) {
        expect(events.length).to.equal(1);
        expect(events[0].type).to.deep.equal('Events');
        expect(events[0].uid).to.deep.equal('last event !');
        expect(firstFetchSpy).to.have.been.called;
        done();
      });
      $httpBackend.flush();
    });
  });
});
