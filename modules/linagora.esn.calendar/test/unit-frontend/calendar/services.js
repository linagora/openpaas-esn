'use strict';

/* global chai: false */
/* global moment: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendar module services', function() {

  describe('The request factory', function() {
    beforeEach(function() {
      angular.mock.module('esn.calendar');
      angular.mock.inject(function(request, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.requestFactory = request;
      });
    });

    it('should perform a call to the given path on the DAV proxy', function(done) {
      var event = {id: 'eventId'};
      this.$httpBackend.expectGET('/dav/api/calendars/test/events.json').respond(event);
      this.requestFactory('get', '/calendars/test/events.json').then(function(response) {
        expect(response.data).to.deep.equal(event);
        done();
      }, done);
      this.$httpBackend.flush();
    });

    it('should perform a call to the DAV proxy even if the given path contains another base URL', function(done) {
      var event = {id: 'eventId'};
      this.$httpBackend.expectGET('/dav/api/calendars/test/events.json').respond(event);
      this.requestFactory('get', 'caldav/server/base/URL/calendars/test/events.json').then(function(response) {
        expect(response.data).to.deep.equal(event);
        done();
      }, done);
      this.$httpBackend.flush();
    });
  });

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
        $provide.value('gracePeriodService', {});
      });
    });

    it('should use the correct path', function(done) {
      angular.mock.inject(function(calendarEventSource, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.calendarEventSource = calendarEventSource;
      });

      var data = {
        match: {start: '20140101T000000', end: '20140102T000000'}
      };
      this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond({
        '_links': {'self': {'href': '/prepath/path/to/calendar.json'}},
        '_embedded': {'dav:item': []}
      });

      var start = moment(new Date(2014, 0, 1));
      var end = moment(new Date(2014, 0, 2));

      var source = this.calendarEventSource('/dav/api/calendars/test/events.json', function() {
      });

      source(start, end, false, function(events) {
        // Just getting here is fine, the http backend will check for the
        // right URL.
        done();
      });
      this.$httpBackend.flush();
    });


    it('should filter cancelled events', function(done) {
      angular.mock.inject(function(calendarEventSource, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.calendarEventSource = calendarEventSource;
      });

      var data = {
        match: {start: '20140101T000000', end: '20140102T000000'}
      };
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
                  ['dtend', {}, 'date-time', '2014-01-01T03:03:04'],
                  ['status', {}, 'text', 'CANCELLED']
                ], []]
              ]
            ]
          }]
        }
      });

      var start = moment(new Date(2014, 0, 1));
      var end = moment(new Date(2014, 0, 2));

      var source = this.calendarEventSource('/dav/api/calendars/test/events.json');

      source(start, end, false, function(events) {
        expect(events).to.deep.equal([]);
        done();
      });
      this.$httpBackend.flush();
    });

    it('should propagate an error if calendar events cannot be retrieved', function(done) {

      var start = moment('2015-01-01 09:00:00');
      var end = moment('2015-01-01 09:30:00');
      var calendarId = 'test';
      var localTimezone = 'local';

      angular.mock.module(function($provide) {
        $provide.factory('calendarService', function() {
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

      var displayCalendarErrorMock = function(errorObject, errorMessage) {
        expect(errorMessage).to.equal('Can not get calendar events');
        done();
      };

      var factoryForCalendarEvents = this.calendarEventSource(calendarId, displayCalendarErrorMock);
      factoryForCalendarEvents(start, end, localTimezone, noErrorsCallback);
      this.$rootScope.$apply();
    });
  });

  describe('The calendarUtils service', function() {
    beforeEach(function() {
      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
    });

    beforeEach(angular.mock.inject(function(calendarUtils, moment) {
      this.calendarUtils = calendarUtils;
      this.moment = moment;
    }));

    it('getEndDateOnCalendarSelect should add 30 minutes to end if diff with start is not 30 minutes', function() {
      var start = moment('2013-02-08 09:00:00');
      var end = moment('2013-02-08 09:30:00');
      var expectedStart = moment('2013-02-08 09:00:00').toDate();
      var expectedEnd = moment('2013-02-08 10:00:00').toDate();
      var date = this.calendarUtils.getDateOnCalendarSelect(start, end);
      expect(date.start.toDate().getTime()).to.equal(expectedStart.getTime());
      expect(date.end.toDate().getTime()).to.equal(expectedEnd.getTime());
    });

    it('getEndDateOnCalendarSelect should remove 30 minutes to start if diff with end is not 30 minutes', function() {
      var start = moment('2013-02-08 09:30:00');
      var end = moment('2013-02-08 10:00:00');
      var expectedStart = moment('2013-02-08 09:00:00').toDate();
      var expectedEnd = moment('2013-02-08 10:00:00').toDate();
      var date = this.calendarUtils.getDateOnCalendarSelect(start, end);
      expect(date.start.toDate().getTime()).to.equal(expectedStart.getTime());
      expect(date.end.toDate().getTime()).to.equal(expectedEnd.getTime());
    });

    it('getEndDateOnCalendarSelect should not add 30 minutes to end if diff with start is not 30 minutes', function() {
      var start = moment('2013-02-08 09:00:00');
      var end = moment('2013-02-08 11:30:00');
      var expectedStart = moment('2013-02-08 09:00:00').toDate();
      var expectedEnd = moment('2013-02-08 11:30:00').toDate();
      var date = this.calendarUtils.getDateOnCalendarSelect(start, end);
      expect(date.start.toDate().getTime()).to.equal(expectedStart.getTime());
      expect(date.end.toDate().getTime()).to.equal(expectedEnd.getTime());
    });
  });

  describe('The eventUtils service', function() {
    var element, fcTitle, fcContent, event, calendarService;

    function Element() {
      this.innerElements = {};
      this.class = [];
      this.attributes = {};
      this.htmlContent = 'aContent';
    }

    Element.prototype.addClass = function(aClass) {
      this.class.push(aClass);
    };

    Element.prototype.attr = function(name, content) {
      this.attributes[name] = content;
    };

    Element.prototype.html = function(content) {
      if (content) {
        this.htmlContent = content;
      }
      return this.htmlContent;
    };

    Element.prototype.find = function(aClass) {
      return this.innerElements[aClass];
    };

    Element.prototype.append = function() {
    };

    beforeEach(function() {
      var asSession = {
        user: {
          _id: '123456',
          emails: ['aAttendee@open-paas.org'],
          emailMap: { 'aAttendee@open-paas.org': true }
        },
        domain: {
          company_name: 'test'
        }
      };
      calendarService = {};

      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('session', asSession);
        $provide.value('calendarService', calendarService);
      });

      var vcalendar = {};
      vcalendar.hasOwnProperty = null; // jshint ignore:line
      event = {
        title: 'myTitle',
        description: 'description',
        location: 'location',
        vcalendar: vcalendar,
        attendees: []
      };

      element = new Element();
      fcContent = new Element();
      fcTitle = new Element();
      element.innerElements['.fc-content'] = fcContent;
      element.innerElements['.fc-title'] = fcTitle;
    });

    beforeEach(angular.mock.inject(function(eventUtils, $rootScope) {
      this.eventUtils = eventUtils;
      this.$rootScope = $rootScope;
    }));

    describe('render function', function() {
      it('should add ellipsis class to .fc-content', function() {
        this.eventUtils.render(event, element);
        expect(fcContent.class).to.deep.equal(['ellipsis']);
      });

      it('should add ellipsis to .fc-title if location is defined and redefined the content html', function() {
        event.location = 'aLocation';
        this.eventUtils.render(event, element);
        expect(fcTitle.class).to.deep.equal(['ellipsis']);
        expect(fcTitle.htmlContent).to.equal('aContent (aLocation)');
      });

      it('should add a title attribute if description is defined', function() {
        event.description = 'aDescription';
        this.eventUtils.render(event, element);
        expect(element.attributes.title).to.equal('aDescription');
      });

      it('should add event-needs-action class if current user is found in the DECLINED attendees', function() {
        event.attendees.push({
          email: 'aAttendee@open-paas.org',
          partstat: 'DECLINED'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-common', 'event-declined']);
      });

      it('should add event-needs-action class if current user is found in the ACCEPTED attendees', function() {
        event.attendees.push({
          email: 'aAttendee@open-paas.org',
          partstat: 'ACCEPTED'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-common', 'event-accepted']);
      });

      it('should add event-needs-action class if current user is found in the NEEDS-ACTION attendees', function() {
        event.attendees.push({
          email: 'aAttendee@open-paas.org',
          partstat: 'NEEDS-ACTION'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-common', 'event-needs-action']);
      });

      it('should add event-tentative class if current user is found in the TENTATIVE attendees', function() {
        event.attendees.push({
          email: 'aAttendee@open-paas.org',
          partstat: 'TENTATIVE'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-common', 'event-tentative']);
      });

      it('should add event-common class otherwise', function() {
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-common']);
      });

      it('should add the event-is-instance class for instances', function() {
        event.isInstance = true;
        this.eventUtils.render(event, element);
        expect(element.class).to.include('event-is-instance');
      });
    });

    describe('copyEventObject function', function() {
      it('should create a copy of an eventObject ', function() {
        var src = {
          vcalendar: ['vcalendar', [], []],
          vevent: ['vevent', [], []],
          something: 'original'
        };
        var dst = {
          something: 'existing'
        };
        this.eventUtils.copyEventObject(src, dst);

        src.vcalendar[0] = 'vcalchanged';
        src.something = 'changed';

        expect(dst.something).to.equal('original');
        expect(dst.vcalendar).to.deep.equal(src.vcalendar);
        expect(dst.vevent).to.deep.equal(src.vevent);
      });
    });

    describe('isOrganizer function', function() {
      it('should return true when the event organizer is the current user', function() {
        var event = {
          organizer: {
            email: 'aAttendee@open-paas.org'
          }
        };
        expect(this.eventUtils.isOrganizer(event)).to.be.true;
      });

      it('should return false when the event organizer is not the current user', function() {
        var event = {
          organizer: {
            email: 'not-organizer@bar.com'
          }
        };
        expect(this.eventUtils.isOrganizer(event)).to.be.false;
      });

      it('should return true when the event is undefined', function() {
        expect(this.eventUtils.isOrganizer(null)).to.be.true;
      });

      it('should return true when the event organizer is undefined', function() {
        var event = {
          organizer: null
        };
        expect(this.eventUtils.isOrganizer(event)).to.be.true;
      });
    });

    describe('isMajorModification function', function() {
      it('should return true when the events do not have the same start date', function() {
        var newEvent = {
          start: moment('2015-01-01 09:00:00'),
          end: moment('2015-01-01 10:00:00')
        };
        var oldEvent = {
          start: moment('2015-01-01 08:00:00'),
          end: moment('2015-01-01 10:00:00')
        };
        expect(this.eventUtils.isMajorModification(newEvent, oldEvent)).to.be.true;
      });

      it('should return true when the events do not have the same end date', function() {
        var newEvent = {
          start: moment('2015-01-01 09:00:00'),
          end: moment('2015-01-01 10:00:00')
        };
        var oldEvent = {
          start: moment('2015-01-01 09:00:00'),
          end: moment('2015-01-01 11:00:00')
        };
        expect(this.eventUtils.isMajorModification(newEvent, oldEvent)).to.be.true;
      });

      it('should return false when the events have the same start and end dates', function() {
        var newEvent = {
          start: moment('2015-01-01 09:00:00'),
          end: moment('2015-01-01 10:00:00')
        };
        var oldEvent = {
          start: moment('2015-01-01 09:00:00'),
          end: moment('2015-01-01 10:00:00')
        };
        expect(this.eventUtils.isMajorModification(newEvent, oldEvent)).to.be.false;
      });
    });

    describe('isNew function', function() {
      it('should return true if event.id is undefined', function() {
        expect(this.eventUtils.isNew({})).to.be.true;
      });

      it('should return false if event.id is defined', function() {
        expect(this.eventUtils.isNew({id: '123'})).to.be.false;
      });
    });

    describe('getEditedEvent function', function() {
      it('should return a promise of editedEvent var if it is new', function(done) {
        var event = {allDay: false};
        this.eventUtils.setEditedEvent(event);
        this.eventUtils.getEditedEvent().then(function(e) {
          expect(e).to.deep.equal(event);
          done();
        }, done);
        this.$rootScope.$apply();
      });

      it('should return a promise of editedEvent var if it is not a recurrent event', function(done) {
        var event = {id: '123'};
        this.eventUtils.setEditedEvent(event);
        this.eventUtils.getEditedEvent().then(function(e) {
          expect(e).to.deep.equal(event);
          done();
        }, done);
        this.$rootScope.$apply();
      });

      it('should return calendarService.getEvent if editedEvent var is a recurrent event', function(done) {
        var event = {id: '123', isInstance: true, path: '/calendars/event'};
        this.eventUtils.setEditedEvent(event);

        var eventFromServer = {id: 'anEvent'};
        calendarService.getEvent = function(path) {
          expect(path).to.equal(event.path);
          return $q.when(eventFromServer);
        };

        this.eventUtils.getEditedEvent().then(function(e) {
          expect(e).to.deep.equal(eventFromServer);
          done();
        }, done);
        this.$rootScope.$apply();
      });
    });
  });

  describe('The calendarService service', function() {
    var ICAL;
    var emitMessage;

    beforeEach(function() {
      var self = this;
      this.tokenAPI = {
        _token: '123',
        getNewToken: function() {
          var token = this._token;
          return $q.when({ data: { token: token } });
        }
      };

      this.socket = function(namespace) {
        expect(namespace).to.equal('/calendars');
        return {
          emit: function(event, data) {
            if (self.socketEmit) {
              self.socketEmit(event, data);
            }
          }
        };
      };
      this.socketEmit = null;
      emitMessage = null;

      this.gracePeriodService = {
        hasTask: function() {
          return true;
        }
      };
      this.gracePeriodLiveNotification = {
        registerListeners: function() {}
      };

      this.uuid4 = {
        // This is a valid uuid4. Change this if you need other uuids generated.
        _uuid: '00000000-0000-4000-a000-000000000000',
        generate: function() {
          return this._uuid;
        }
      };

      this.jstz = {
        determine: function() {
          return {
          name: function() {
            return 'Europe/Paris';
          }};
        }
      };


      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
        $provide.value('jstz', self.jstz);
        $provide.value('uuid4', self.uuid4);
        $provide.value('socket', self.socket);
        $provide.value('gracePeriodService', self.gracePeriodService);
        $provide.value('gracePeriodLiveNotification', self.gracePeriodLiveNotification);
      });
    });

    beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, _ICAL_, CalendarShell) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$rootScope.$emit = function(message) {
        emitMessage = message;
      };
      this.calendarService = calendarService;
      this.CalendarShell = CalendarShell;

      ICAL = _ICAL_;
    }));

    describe('The listEvents fn', function() {

      it('should list non-recurring events', function(done) {
        var data = {
          match: { start: '20140101T000000', end: '20140102T000000' }
        };
        this.$httpBackend.expectPOST('/dav/api/calendars/uid/events.json', data).respond({
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

        var start = moment(new Date(2014, 0, 1));
        var end = moment(new Date(2014, 0, 2));

        this.calendarService.listEvents('/calendars/uid/events.json', start, end, false).then(function(events) {
            expect(events).to.be.an.array;
            expect(events.length).to.equal(1);
            expect(events[0].id).to.equal('myuid');
            expect(events[0].uid).to.equal('myuid');
            expect(events[0].title).to.equal('title');
            expect(events[0].location).to.equal('location');
            expect(events[0].start.toDate()).to.equalDate(moment('2014-01-01 02:03:04').toDate());
            expect(events[0].end.toDate()).to.equalDate(moment('2014-01-01 03:03:04').toDate());
            expect(events[0].vcalendar).to.be.an('object');
            expect(events[0].vevent).to.be.an('object');
            expect(events[0].etag).to.equal('"123123"');
            expect(events[0].path).to.equal('/prepath/path/to/calendar/myuid.ics');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should list recurring events', function(done) {
        var data = {
          match: { start: '20140101T000000', end: '20140103T000000' }
        };
        this.$httpBackend.expectPOST('/dav/api/calendars/uid/events.json', data).respond({
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
            }]
          }
        });

        var start = moment(new Date(2014, 0, 1));
        var end = moment(new Date(2014, 0, 3));

        this.calendarService.listEvents('/calendars/uid/events.json', start, end, false).then(function(events) {
            expect(events).to.be.an.array;
            expect(events.length).to.equal(2);
            expect(events[0].uid).to.equal('myuid');
            expect(events[0].isInstance).to.be.true;
            expect(events[0].id).to.equal('myuid_2014-01-01T02:03:04Z');
            expect(events[0].start.toDate()).to.equalDate(moment('2014-01-01 02:03:04').toDate());
            expect(events[0].end.toDate()).to.equalDate(moment('2014-01-01 03:03:04').toDate());
            expect(events[0].vcalendar).to.be.an('object');
            expect(events[0].vevent).to.be.an('object');
            expect(events[0].etag).to.equal('"123123"');
            expect(events[0].path).to.equal('/prepath/path/to/calendar/myuid.ics');

            expect(events[1].uid).to.equal('myuid');
            expect(events[1].isInstance).to.be.true;
            expect(events[1].id).to.equal('myuid_2014-01-02T02:03:04Z');
            expect(events[1].start.toDate()).to.equalDate(moment('2014-01-02 02:03:04').toDate());
            expect(events[1].end.toDate()).to.equalDate(moment('2014-01-02 03:03:04').toDate());
            expect(events[1].vcalendar).to.be.an('object');
            expect(events[1].vevent).to.be.an('object');
            expect(events[1].etag).to.equal('"123123"');
            expect(events[1].path).to.equal('/prepath/path/to/calendar/myuid.ics');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

    });

    afterEach(function() {
      this.socketEmit = function() {};
    });

    describe('The getEvent fn', function() {

      it('should return an event', function(done) {
        // The caldav server will be hit
        this.$httpBackend.expectGET('/dav/api/path/to/event.ics').respond(
          ['vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'myuid'],
              ['summary', {}, 'text', 'title'],
              ['location', {}, 'text', 'location'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04'],
              ['attendee', { 'partstat': 'ACCEPTED', 'cn': 'name' }, 'cal-address', 'mailto:test@example.com'],
              ['attendee', { 'partstat': 'DECLINED' }, 'cal-address', 'mailto:noname@example.com'],
              ['attendee', { 'partstat': 'YOLO' }, 'cal-address', 'mailto:yolo@example.com'],
              ['organizer', { 'cn': 'organizer' }, 'cal-address', 'mailto:organizer@example.com']
           ], []]
         ]],
          // headers:
          { 'ETag': 'testing-tag' }
        );

        this.calendarService.getEvent('/path/to/event.ics').then(function(event) {
          expect(event).to.be.an('object');
          expect(event.id).to.equal('myuid');
          expect(event.title).to.equal('title');
          expect(event.location).to.equal('location');
          expect(event.allDay).to.be.false;
          expect(event.start.toDate()).to.equalDate(new Date(2014, 0, 1, 2, 3, 4));
          expect(event.end.toDate()).to.equalDate(new Date(2014, 0, 1, 3, 3, 4));
          expect(event.formattedDate).to.equal('January 1, 2014');
          expect(event.formattedStartTime).to.equal('2');
          expect(event.formattedStartA).to.equal('am');
          expect(event.formattedEndTime).to.equal('3');
          expect(event.formattedEndA).to.equal('am');

          expect(event.attendees).to.deep.equal([
            {
              fullmail: 'name <test@example.com>',
              email: 'test@example.com',
              name: 'name',
              partstat: 'ACCEPTED',
              displayName: 'name'
            },
            {
              fullmail: 'noname@example.com',
              email: 'noname@example.com',
              name: 'noname@example.com',
              partstat: 'DECLINED',
              displayName: 'noname@example.com'
            },
            {
              fullmail: 'yolo@example.com',
              email: 'yolo@example.com',
              name: 'yolo@example.com',
              partstat: 'YOLO',
              displayName: 'yolo@example.com'
            }
          ]);

          expect(event.organizer).to.deep.equal({
            fullmail: 'organizer <organizer@example.com>',
            email: 'organizer@example.com',
            name: 'organizer',
            displayName: 'organizer'
          });

          expect(event.vcalendar).to.be.an('object');
          expect(event.path).to.equal('/path/to/event.ics');
          expect(event.etag).to.equal('testing-tag');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The create fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      it('should fail on missing vevent', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        this.calendarService.createEvent('/path/to/uid.ics', vcalendar, { graceperiod: true }).then(
          unexpected.bind(null, done), function(e) {
            expect(e.message).to.equal('Missing VEVENT in VCALENDAR');
            done();
          }
        );
        this.$rootScope.$apply();
      });

      it('should fail on missing uid', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vcalendar.addSubcomponent(vevent);

        this.calendarService.createEvent('/path/to/calendar', vcalendar, { graceperiod: true }).then(
          unexpected.bind(null, done), function(e) {
            expect(e.message).to.equal('Missing UID in VEVENT');
            done();
          }
        );
        this.$rootScope.$apply();
      });

      it('should fail on 500 response status', function(done) {
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(500, '');

        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };

        this.calendarService.createEvent('/path/to/calendar', vcalendar, { graceperiod: true }).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(500);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should fail on a 2xx status that is not 202', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(200, '');

        this.calendarService.createEvent('/path/to/calendar', vcalendar, { graceperiod: true }).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(200);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should silently fail if the response of getEvent is 404 and the task is not cancelled', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
        vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
        vevent.addPropertyWithValue('summary', 'test event');
        vcalendar.addSubcomponent(vevent);

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:created');
          expect(data).to.deep.equal(vcalendar);
        });
        this.socketEmit = socketEmitSpy;

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(404);
        emitMessage = null;

        this.calendarService.createEvent('/path/to/calendar', vcalendar, { graceperiod: true }).then(
          function(response) {
            expect(socketEmitSpy).to.not.have.been.called;
            expect(response).to.not.exist;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed when everything is correct', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
        vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
        vevent.addPropertyWithValue('summary', 'test event');
        vcalendar.addSubcomponent(vevent);

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };
        this.gracePeriodService.remove = function(taskId) {
          expect(taskId).to.equal('123456789');
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:created');
          expect(data).to.deep.equal(vcalendar);
        });
        this.socketEmit = socketEmitSpy;

        var headers = { 'ETag': 'etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);
        emitMessage = null;

        this.calendarService.createEvent('/path/to/calendar', vcalendar, { graceperiod: true }).then(
          function(shell) {
            expect(emitMessage).to.equal('modifiedCalendarItem');
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('etag');
            expect(shell.path).to.equal('/path/to/calendar/00000000-0000-4000-a000-000000000000.ics');
            expect(shell.vcalendar.toJSON()).to.deep.equal(vcalendar.toJSON());
            expect(socketEmitSpy).to.have.been.called;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed calling gracePeriodService.cancel', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
        vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
        vcalendar.addSubcomponent(vevent);

        var successSpy = sinon.spy();
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: true,
            success: successSpy
          });
        };
        this.gracePeriodService.cancel = function(taskId) {
          var deffered = $q.defer();
          deffered.resolve({});
          return deffered.promise;
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:created');
          expect(data).to.deep.equal(vcalendar);
        });
        this.socketEmit = socketEmitSpy;

        var headers = { 'ETag': 'etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);
        emitMessage = null;

        this.calendarService.createEvent('/path/to/calendar', vcalendar, { graceperiod: true }).then(
          function(response) {
            expect(emitMessage).to.equal('removedCalendarItem');
            expect(socketEmitSpy).to.have.not.been.called;
            expect(successSpy).to.have.been.called;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The modify fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      beforeEach(function() {
        this.event = {
          id: '00000000-0000-4000-a000-000000000000',
          title: 'test event',
          start: moment(),
          end: moment(),
          attendees: [
            {emails: ['user1@lng.com'], partstat: 'ACCEPTED'},
            {emails: ['user2@lng.com'], partstat: 'NEEDS-ACTION'}
          ]
        };
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('summary', 'test event');
        vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date())).setParameter('tzid', 'Europe/Paris');
        vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date())).setParameter('tzid', 'Europe/Paris');
        vevent.addPropertyWithValue('transp', 'OPAQUE');
        this.event.attendees.forEach(function(attendee) {
          var mailto = 'mailto:' + attendee.emails[0];
          var property = vevent.addPropertyWithValue('attendee', mailto);
          property.setParameter('partstat', attendee.partstat);
          property.setParameter('rsvp', 'TRUE');
          property.setParameter('role', 'REQ-PARTICIPANT');
        });
        vcalendar.addSubcomponent(vevent);
        this.vcalendar = vcalendar;
      });

      it('should fail if status is not 202', function(done) {
        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=10000').respond(200);

        this.calendarService.modifyEvent('/path/to/uid.ics', this.event, null, 'etag').then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(200);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 202', function(done) {
        var headers = { 'ETag': 'changed-etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=10000').respond(202, { id: '123456789' });
        this.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };

        this.gracePeriodService.remove = function(taskId) {
          expect(taskId).to.equal('123456789');
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:updated');
        });
        this.socketEmit = socketEmitSpy;

        this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag').then(
          function(shell) {
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('changed-etag');
            expect(emitMessage).to.equal('modifiedCalendarItem');
            expect(shell.path).to.equal('/path/to/uid.ics');
            expect(socketEmitSpy).to.have.been.called;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should send etag as If-Match header', function(done) {
        var requestHeaders = {
          'Content-Type': 'application/calendar+json',
          'Prefer': 'return=representation',
          'If-Match': 'etag',
          'Accept': 'application/json, text/plain, */*'
        };
        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=10000', this.vcalendar.toJSON(), requestHeaders).respond(202, { id: '123456789' }, { 'ETag': 'changed-etag' });
        this.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, this.vcalendar.toJSON());

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };

        this.gracePeriodService.remove = function(taskId) {
          expect(taskId).to.equal('123456789');
        };

        this.calendarService.modifyEvent('/path/to/uid.ics', this.event, null, 'etag').then(
          function(shell) { done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should reset the attendees participation if majorModification parameter is true', function(done) {
        var headers = { 'ETag': 'changed-etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=10000', function(data) {
          var vcalendar = new ICAL.Component(JSON.parse(data));
          var vevent = vcalendar.getFirstSubcomponent('vevent');
          vevent.getAllProperties('attendee').forEach(function(att) {
            expect(att.getParameter('partstat')).to.equal('NEEDS-ACTION');
          });
          return true;
        }).respond(202, { id: '123456789' });
        this.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };

        this.gracePeriodService.remove = function(taskId) {
          expect(taskId).to.equal('123456789');
        };

        this.calendarService.modifyEvent('/path/to/uid.ics', this.event, null, 'etag', true).then(
          function() {
            done();
          }, unexpected.bind(null, done)
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed calling gracePeriodService.cancel', function(done) {
        var successSpy = sinon.spy();
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: true,
            success: successSpy
          });
        };
        this.gracePeriodService.cancel = function(taskId) {
          var deffered = $q.defer();
          deffered.resolve({});
          return deffered.promise;
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:created');
        });
        this.socketEmit = socketEmitSpy;

        var headers = { 'ETag': 'etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), headers);
        emitMessage = null;

        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, null, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal('modifiedCalendarItem');
            expect(socketEmitSpy).to.have.not.been.called;
            expect(successSpy).to.have.been.called;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The remove fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      beforeEach(function() {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('summary', 'test event');
        vcalendar.addSubcomponent(vevent);
        this.vcalendar = vcalendar;
        this.event = {
          id: '00000000-0000-4000-a000-000000000000',
          title: 'test event',
          start: moment(),
          end: moment()
        };
      });

      it('should fail if status is not 202', function(done) {
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(201);

        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should cancel the task if there is no etag', function(done) {
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };
        this.gracePeriodService.cancel = function(taskId) {
          return $q.when();
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:deleted');
          expect(data).to.deep.equal(this.CalendarShell.toICAL(this.event));
        });
        this.socketEmit = socketEmitSpy;

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event).then(
          function(response) {
            expect(emitMessage).to.equal('removedCalendarItem');
            expect(socketEmitSpy).to.not.have.been.called;
            expect(response).to.be.false;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 202 and send a websocket event', function(done) {
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };
        this.gracePeriodService.remove = function(taskId) {
          expect(taskId).to.equal('123456789');
        };

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal('event:deleted');
          expect(data).to.deep.equal(this.CalendarShell.toICAL(this.event));
        });
        this.socketEmit = socketEmitSpy;

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal('removedCalendarItem');
            expect(socketEmitSpy).to.have.been.called;
            expect(response).to.be.true;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed calling gracePeriodService.cancel', function(done) {
        var successSpy = sinon.spy();
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: true,
            success: successSpy
          });
        };
        this.gracePeriodService.cancel = function(taskId) {
          var deffered = $q.defer();
          deffered.resolve({});
          return deffered.promise;
        };

        var socketEmitSpy = sinon.spy();
        this.socketEmit = socketEmitSpy;

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal('addedCalendarItem');
            expect(socketEmitSpy).to.have.not.been.called;
            expect(successSpy).to.have.been.called;
            expect(response).to.be.false;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should register an error handler for grace period error', function(done) {
        var taskId = '123456789';
        var registerSpy = sinon.spy(function(id, onError, onSuccess) {
          expect(id).to.equal(taskId);
          expect(onError).to.be.a.function;
          expect(onSuccess).to.not.exist;
        });
        this.gracePeriodLiveNotification.registerListeners = registerSpy;

        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };
        this.gracePeriodService.remove = function(id) {
          expect(id).to.equal(taskId);
        };

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: taskId});

        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal('removedCalendarItem');
            expect(registerSpy).to.have.been.called;
            expect(response).to.be.true;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 202 and not send a websocket event if graced remove failed', function(done) {
        var taskId = '123456789';
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: false
          });
        };
        this.gracePeriodService.remove = function(id) {
          expect(taskId).to.equal(taskId);
        };
        this.gracePeriodService.hasTask = function() {
          return false;
        };

        this.gracePeriodLiveNotification.registerListeners = function(id, onError, onSuccess) {
          expect(id).to.equal(taskId);
          expect(onError).to.be.a.function;
          expect(onSuccess).to.not.exist;
          onError();
        };

        var socketEmitSpy = sinon.spy();
        this.socketEmit = socketEmitSpy;

        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: taskId});

        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(socketEmitSpy).to.have.not.been.called;
            expect(response).to.be.true;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The changeParticipation fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      beforeEach(function() {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('summary', 'test event');
        vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(moment().toDate())).setParameter('tzid', this.jstz.determine().name());
        vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(moment().toDate())).setParameter('tzid', this.jstz.determine().name());
        vevent.addPropertyWithValue('transp', 'OPAQUE');
        vevent.addPropertyWithValue('location', 'test location');
        var att = vevent.addPropertyWithValue('attendee', 'mailto:test@example.com');
        att.setParameter('partstat', 'DECLINED');
        att.setParameter('rsvp', 'TRUE');
        att.setParameter('role', 'REQ-PARTICIPANT');
        vcalendar.addSubcomponent(vevent);
        this.vcalendar = vcalendar;
        this.event = {
          id: '00000000-0000-4000-a000-000000000000',
          title: 'test event',
          location: 'test location',
          start: moment(),
          end: moment(),
          attendees: [{
            email: 'test@example.com',
            partstat: 'DECLINED'
          }]
        };
      });

      it('should return null if event.attendees is not an array', function(done) {
        var emails = ['test@example.com'];
        var event = {
          id: '00000000-0000-4000-a000-000000000000',
          title: 'test event',
          location: 'test location',
          start: moment(),
          end: moment(),
          attendees: []
        };

        this.calendarService.changeParticipation('/path/to/uid.ics', event, emails, 'ACCEPTED').then(
          function(response) { expect(response).to.be.null; done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should change the participation status', function(done) {

        var emails = ['test@example.com'];
        var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
        var vevent = copy.getFirstSubcomponent('vevent');
        var att = vevent.getFirstProperty('attendee');
        att.setParameter('partstat', 'ACCEPTED');

        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON()).respond(200, this.vcalendar.toJSON());

        this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'ACCEPTED').then(
          function(response) { done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should not change the participation status when the status is the actual attendee status', function(done) {
        var emails = ['test@example.com'];

        this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'DECLINED').then(
          function(response) { expect(response).to.be.null; done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should retry participation change on 412', function(done) {

        var emails = ['test@example.com'];
        var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
        var vevent = copy.getFirstSubcomponent('vevent');
        var att = vevent.getFirstProperty('attendee');
        att.setParameter('partstat', 'ACCEPTED');

        var requestHeaders = {
          'If-Match': 'etag',
          'Prefer': 'return=representation',
          'Content-Type': 'application/calendar+json',
          'Accept': 'application/json, text/plain, */*'
        };

        var conflictHeaders = {
          'ETag': 'conflict'
        };

        var successRequestHeaders = {
          'If-Match': 'conflict',
          'Prefer': 'return=representation',
          'Content-Type': 'application/calendar+json',
          'Accept': 'application/json, text/plain, */*'
        };
        var successHeaders = {
          'ETag': 'success'
        };

        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON(), requestHeaders).respond(412, this.vcalendar.toJSON(), conflictHeaders);
        this.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), conflictHeaders);
        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON(), successRequestHeaders).respond(200, this.vcalendar.toJSON(), successHeaders);

        this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'ACCEPTED', 'etag').then(
          function(shell) {
            expect(shell.etag).to.equal('success');
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      // Everything else is covered by the modify fn
    });

  });

  describe('the calendarAttendeeService', function() {
    var attendeeService = {};

    beforeEach(function() {
      attendeeService.addProvider = function() {};
      attendeeService.getAttendeeCandidates = function() {
        return $q.when([]);
      };

      angular.mock.module('esn.calendar');
      angular.mock.module(function($provide) {
        $provide.value('attendeeService', attendeeService);
      });

      angular.mock.inject(function($rootScope) {
        this.$rootScope = $rootScope;
      });
    });

    beforeEach(angular.mock.inject(function(calendarAttendeeService) {
      this.calendarAttendeeService = calendarAttendeeService;
    }));

    describe('the getAttendeeCandidates function', function() {

      it('should return a promise', function() {
        var promise = this.calendarAttendeeService.getAttendeeCandidates('query', 10);
        expect(promise.then).to.be.a.function;
      });

      it('should add a need-action parstat to all attendeeCandidates returned by the attendeeService', function(done) {
        var query = 'query';
        var limit = 42;
        attendeeService.getAttendeeCandidates = function(q, l) {
          expect(q).to.equal(query);
          expect(l).to.equal(limit);
          return $q.when([{_id: 'attendee1'}, {_id: 'attendee2'}]);
        };

        this.calendarAttendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([{_id: 'attendee1', partstat: 'NEEDS-ACTION'}, {_id: 'attendee2', partstat: 'NEEDS-ACTION'}]);
          done();
        }, function(err) {
          done(err);
        });
        this.$rootScope.$apply();
      });
    });
  });
});
