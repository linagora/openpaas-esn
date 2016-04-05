'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The calendarService service', function() {
  var ICAL, moment, CalendarCollectionShellMock, CalendarCollectionShellFuncMock, cachedEventSourceMock, flushContext, self;

  beforeEach(function() {
    self = this;

    this.tokenAPI = {
      _token: '123',
      getNewToken: function() {
        var token = this._token;
        return $q.when({ data: { token: token } });
      }
    };

    cachedEventSourceMock = {
      registerAdd: sinon.spy(),
      registerDelete: sinon.spy(),
      registerUpdate: sinon.spy(),
      deleteRegistration: sinon.spy()
    };

    this.gracePeriodService = {
      hasTask: function() {
        return true;
      },
      flushTasksFor: function(context) {
        expect(flushContext).to.deep.equal(context);
        return $q.when([]);
      },
      grace: function() {
        return $q.when({});
      },
      remove: angular.noop
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

    this.calendarEventEmitterMock = {
      activitystream: {
        emitPostedMessage: sinon.spy()
      },
      fullcalendar: {
        emitCreatedEvent: sinon.spy(),
        emitRemovedEvent: sinon.spy(),
        emitModifiedEvent: sinon.spy()
      }
    };

    CalendarCollectionShellMock = function() {
      return CalendarCollectionShellFuncMock.apply(this, arguments);
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
      $provide.value('$modal', self.$modal);
      $provide.value('CalendarCollectionShell', CalendarCollectionShellMock);
      $provide.value('cachedEventSource', cachedEventSourceMock);
      $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      $provide.decorator('masterEventCache', function($delegate) {
        self.masterEventCache = {
          get: $delegate.get,
          remove: sinon.spy($delegate.remove),
          save: sinon.spy($delegate.save)
        };
        return self.masterEventCache;
      });
    });
  });

  beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, _ICAL_, CalendarShell, fcMoment, _moment_, CALENDAR_EVENTS, DEFAULT_CALENDAR_ID, CALENDAR_GRACE_DELAY) {
    this.$httpBackend = $httpBackend;
    this.$rootScope = $rootScope;
    this.calendarService = calendarService;
    this.CalendarShell = CalendarShell;
    this.fcMoment = fcMoment;
    ICAL = _ICAL_;
    moment = _moment_;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;
    this.DEFAULT_CALENDAR_ID = DEFAULT_CALENDAR_ID;
    this.CALENDAR_GRACE_DELAY = CALENDAR_GRACE_DELAY;
  }));

  afterEach(function() {
    flushContext = null;
  });

  describe('The listCalendars fn', function() {
    var response;

    beforeEach(function() {
      response = {
        _links: {
          self: {
            href:'\/calendars\/56698ca29e4cf21f66800def.json'
          }
        },
        _embedded: {
          'dav:calendar': [
            {
              _links: {
                self: {
                  href: '\/calendars\/56698ca29e4cf21f66800def\/events.json'
                }
              },
              'dav:name': null,
              'caldav:description': null,
              'calendarserver:ctag': 'http:\/\/sabre.io\/ns\/sync\/3',
              'apple:color': null,
              'apple:order': null
            }
          ]
        }
      };
    });

    it('should wrap each received dav:calendar in a CalendarCollectionShell', function(done) {
      var calendarCollection = {id: this.DEFAULT_CALENDAR_ID};
      CalendarCollectionShellFuncMock = sinon.spy(function(davCal) {
        expect(davCal).to.deep.equal(response._embedded['dav:calendar'][0]);
        return calendarCollection;
      });

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json').respond(response);

      this.calendarService.listCalendars('homeId').then(function(calendars) {
        expect(calendars).to.have.length(1);
        expect(calendars[0]).to.equal(calendarCollection);
        expect(CalendarCollectionShellFuncMock).to.have.been.called;
        done();
      });

      this.$httpBackend.flush();
    });

    it('should cache calendars', function() {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json').respond(response);

      this.calendarService.listCalendars('homeId').then(function(calendars) {
        self.calendarService.listCalendars('homeId').then(function(calendars2) {
          expect(calendars).to.equal(calendars2);
        });
      });

      this.$httpBackend.flush();
    });
  });

  describe('The get calendar fn', function() {
    it('should wrap the received dav:calendar in a CalendarCollectionShell', function(done) {

      var response = {
        _links: {
          self: {
            href: '\/calendars\/56698ca29e4cf21f66800def\/events.json'
          }
        },
        'dav:name': null,
        'caldav:description': null,
        'calendarserver:ctag': 'http:\/\/sabre.io\/ns\/sync\/3',
        'apple:color': null,
        'apple:order': null
      };

      var calendarCollection = {};
      CalendarCollectionShellFuncMock = sinon.spy(function(davCal) {
        expect(davCal).to.deep.equal(response);
        return calendarCollection;
      });

      this.$httpBackend.expectGET('/dav/api/calendars/homeId/id.json').respond(response);

      this.calendarService.getCalendar('homeId', 'id').then(function(calendar) {
        expect(calendar).to.equal(calendarCollection);
        expect(CalendarCollectionShellFuncMock).to.have.been.called;
        done();
      });

      this.$httpBackend.flush();

    });
  });

  describe('The create calendar fn', function() {
    it('should send a post request to the correct URL', function() {
      var calendar = {id: 'calId'};

      CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

      this.$httpBackend.expectPOST('/dav/api/calendars/homeId.json').respond(201, {});

      var promiseSpy = sinon.spy();
      this.calendarService.createCalendar('homeId', calendar).then(promiseSpy);

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(promiseSpy).to.have.been.calledWith(calendar);
      expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(calendar);
    });

    it('should sync cache of list calendars', function(done) {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json').respond({_embedded:{
        'dav:calendar': [{id:1}, {id:2}]
      }});
      this.$httpBackend.expectPOST('/dav/api/calendars/homeId.json').respond(201, {});

      this.calendarService.listCalendars('homeId').then(function(calendars) {
        var calendar = {id: 'calId'};
        CalendarCollectionShellMock.toDavCalendar = angular.identity;
        self.calendarService.createCalendar('homeId', calendar).then(function() {
          self.calendarService.listCalendars('homeId').then(function(calendar) {
            expect(calendar).to.shallowDeepEqual({
              length: 3,
              2: {id: 'calId'}
            });
            done();
          });
        });
      });

      this.$httpBackend.flush();
      this.$rootScope.$digest();
    });
  });

  describe('The modify calendar fn', function() {
    it('should send a put request to the correct URL and return resulting calendar', function() {
      var calendar = {id: 'calId'};

      CalendarCollectionShellMock.toDavCalendar = sinon.spy(angular.identity);

      this.$httpBackend.expect('PROPPATCH', '/dav/api/calendars/homeId/calId.json').respond(204, {});

      var promiseSpy = sinon.spy();
      this.calendarService.modifyCalendar('homeId', calendar).then(promiseSpy);

      this.$httpBackend.flush();
      this.$rootScope.$digest();

      expect(promiseSpy).to.have.been.calledWith(calendar);
      expect(CalendarCollectionShellMock.toDavCalendar).to.have.been.calledWith(calendar);
    });

    it('should sync cache of list calendars', function(done) {
      CalendarCollectionShellFuncMock = angular.identity;

      this.$httpBackend.expectGET('/dav/api/calendars/homeId.json').respond({_embedded:{
        'dav:calendar': [{id:1}, {id:'events', selected: true}]
      }});
      this.$httpBackend.expect('PROPPATCH', '/dav/api/calendars/homeId/events.json').respond(204, {});

      this.calendarService.listCalendars('homeId').then(function(calendars) {
        var calendar = {id: 'events', name: 'modified cal'};
        CalendarCollectionShellMock.toDavCalendar = angular.identity;
        self.calendarService.modifyCalendar('homeId', calendar).then(function() {
          self.calendarService.listCalendars('homeId').then(function(calendar) {
            expect(calendar).to.shallowDeepEqual({
              length: 2,
              1: {id: 'events', name: 'modified cal', selected: true}
            });
            done();
          });
        });
      });

      this.$httpBackend.flush();
      this.$rootScope.$digest();
    });
  });

  describe('The listEvents fn', function() {

    it('should list non-recurring events', function(done) {
      var data = {
        match: { start: '20140101T000000', end: '20140102T000000' }
      };
      this.$httpBackend.expectPOST('/dav/api/calendars/uid/events.json', data).respond({
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
                  ['dtend', {}, 'date-time', '2014-01-01T03:03:04']
                ], []]
              ]
            ]
          }]
        }
      });

      var start = this.fcMoment(new Date(2014, 0, 1));
      var end = this.fcMoment(new Date(2014, 0, 2));

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
      }).finally(done);

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should list recurring events', function(done) {
      var data = {
        match: { start: '20140101T000000', end: '20140103T000000' }
      };
      this.$httpBackend.expectPOST('/dav/api/calendars/uid/events.json', data).respond({
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

      var start = this.fcMoment(new Date(2014, 0, 1));
      var end = this.fcMoment(new Date(2014, 0, 3));

      this.calendarService.listEvents('/calendars/uid/events.json', start, end, false).then(function(events) {
        expect(events).to.be.an.array;
        expect(events.length).to.equal(2);
        expect(events[0].uid).to.equal('myuid');
        expect(events[0].isInstance()).to.be.true;
        expect(events[0].id).to.equal('myuid_2014-01-01T02:03:04Z');
        expect(events[0].start.toDate()).to.equalDate(moment('2014-01-01 02:03:04').toDate());
        expect(events[0].end.toDate()).to.equalDate(moment('2014-01-01 03:03:04').toDate());
        expect(events[0].vcalendar).to.be.an('object');
        expect(events[0].vevent).to.be.an('object');
        expect(events[0].etag).to.equal('"123123"');
        expect(events[0].path).to.equal('/prepath/path/to/calendar/myuid.ics');

        expect(events[1].uid).to.equal('myuid');
        expect(events[1].isInstance()).to.be.true;
        expect(events[1].id).to.equal('myuid_2014-01-02T02:03:04Z');
        expect(events[1].start.toDate()).to.equalDate(moment('2014-01-02 02:03:04').toDate());
        expect(events[1].end.toDate()).to.equalDate(moment('2014-01-02 03:03:04').toDate());
        expect(events[1].vcalendar).to.be.an('object');
        expect(events[1].vevent).to.be.an('object');
        expect(events[1].etag).to.equal('"123123"');
        expect(events[1].path).to.equal('/prepath/path/to/calendar/myuid.ics');
      }).finally(done);

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

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
            ['attendee', { partstat: 'ACCEPTED', cn: 'name' }, 'cal-address', 'mailto:test@example.com'],
            ['attendee', { partstat: 'DECLINED' }, 'cal-address', 'mailto:noname@example.com'],
            ['attendee', { partstat: 'YOLO' }, 'cal-address', 'mailto:yolo@example.com'],
            ['organizer', { cn: 'organizer' }, 'cal-address', 'mailto:organizer@example.com']
          ], []]
        ]],
        // headers:
        { ETag: 'testing-tag' }
      );

      this.calendarService.getEvent('/path/to/event.ics').then(function(event) {
        expect(event).to.be.an('object');
        expect(event.id).to.equal('myuid');
        expect(event.title).to.equal('title');
        expect(event.location).to.equal('location');
        expect(event.allDay).to.be.false;
        expect(event.start.toDate()).to.equalDate(new Date(2014, 0, 1, 2, 3, 4));
        expect(event.end.toDate()).to.equalDate(new Date(2014, 0, 1, 3, 3, 4));

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
      }).finally(done);

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });
  });

  describe('The create fn', function() {
    function unexpected(done) {
      done(new Error('Unexpected'));
    }

    it('should fail on 500 response status', function(done) {
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(500, '');

      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).then(
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
      var event = new this.CalendarShell(vcalendar);

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(200, '');

      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).then(
        unexpected.bind(null, done), function(response) {
          expect(response.status).to.equal(200);
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should succeed when everything is correct and return true', function(done) {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
      vevent.addPropertyWithValue('summary', 'test event');
      vcalendar.addSubcomponent(vevent);
      var path = '/path/to/calendar/00000000-0000-4000-a000-000000000000.ics';
      var etag = 'ETAG';
      var gracePeriodTaskId = '123456789';
      var calendarShell = new this.CalendarShell(vcalendar, {
        path: path,
        etag: etag
      });

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };
      this.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal(gracePeriodTaskId);
      };

      var headers = { ETag: etag };
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: gracePeriodTaskId});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);

      this.calendarService.createEvent('calId', '/path/to/calendar', calendarShell, { graceperiod: true, notifyFullcalendar: true }).then(
        function(completed) {
          expect(self.calendarEventEmitterMock.fullcalendar.emitCreatedEvent).to.have.been.called;
          expect(completed).to.be.true;
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should succeed calling gracePeriodService.cancel and return false', function(done) {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);

      var successSpy = sinon.spy();
      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          success: successSpy
        });
      };
      this.gracePeriodService.cancel = function() {
        return $q.when({});
      };

      var headers = { ETag: 'etag' };
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);

      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).then(
        function(completed) {
          expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.called;
          expect(successSpy).to.have.been.called;
          expect(completed).to.be.false;
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call cachedEventSource.registerAdd', function(done) {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), {ETag: 'etag'});

      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).then(
        function() {
          expect(cachedEventSourceMock.registerAdd).to.have.been.calledWith(event);
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call masterEventCache.save if and only if it is a recurring event', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);
      event.isRecurring = _.constant(true);

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });

      this.$rootScope.$apply();
      this.$httpBackend.flush();

      event.isRecurring = _.constant(false);

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });

      this.$rootScope.$apply();
      this.$httpBackend.flush();

      expect(this.masterEventCache.save).to.have.been.calledOnce;
      expect(this.masterEventCache.save).to.have.been.calledWith(event);
    });

    it('should call cachedEventSource.deleteRegistration if the creation is cancelled', function(done) {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      cachedEventSourceMock.deleteRegistration = function(_event) {
        expect(_event).to.equal(event);
        done();
      };

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), {ETag: 'etag'});

      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call masterEventCache.remove if the creation is cancelled and if and only if event is a recurring event', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      event.isRecurring = _.constant(true);
      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });
      this.$rootScope.$apply();
      this.$httpBackend.flush();

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      event.isRecurring = _.constant(false);
      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });
      this.$rootScope.$apply();
      this.$httpBackend.flush();

      expect(this.masterEventCache.remove).to.have.been.calledOnce;
      expect(this.masterEventCache.remove).to.have.been.calledWith(event);
    });

    it('should transmit an error message to grace task even if the error message from the backend is empty', function(done) {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new this.CalendarShell(vcalendar);

      var statusErrorText = '';
      var errorSpy = sinon.spy(function(error) {
        expect(error).to.be.not.empty;
      });

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          error: errorSpy
        });
      };

      this.gracePeriodService.cancel = function(taskId) {
        var deffered = $q.defer();
        deffered.reject({statusText: statusErrorText});
        return deffered.promise;
      };

      var headers = { ETag: 'etag' };
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);

      this.calendarService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true, notifyFullcalendar: true }).catch(
        function() {
          expect(self.calendarEventEmitterMock.fullcalendar.emitCreatedEvent).to.have.been.called;
          expect(errorSpy).to.have.been.called;
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
      var attendees = [
        {emails: ['user1@lng.com'], partstat: 'ACCEPTED'},
        {emails: ['user2@lng.com'], partstat: 'NEEDS-ACTION'}
      ];
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('summary', 'test event');
      vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date())).setParameter('tzid', 'Europe/Paris');
      vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date())).setParameter('tzid', 'Europe/Paris');
      vevent.addPropertyWithValue('transp', 'OPAQUE');
      attendees.forEach(function(attendee) {
        var mailto = 'mailto:' + attendee.emails[0];
        var property = vevent.addPropertyWithValue('attendee', mailto);
        property.setParameter('partstat', attendee.partstat);
        property.setParameter('rsvp', 'TRUE');
        property.setParameter('role', 'REQ-PARTICIPANT');
      });
      vcalendar.addSubcomponent(vevent);
      this.vcalendar = vcalendar;
      this.vevent = vevent;

      this.event = new this.CalendarShell(this.vcalendar, {
        path: '/path/to/uid.ics'
      });
      this.oldEvent = this.event.clone();
      this.oldEvent.start = this.event.start.clone().add(1, 'hour');

      flushContext = {
        id: this.event.id
      };
    });

    it('should fail if status is not 202', function(done) {
      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(200);

      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        unexpected.bind(null, done), function(response) {
          expect(response.status).to.equal(200);
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should succeed on 202 and return true', function(done) {
      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        function(completed) {
          expect(completed).to.be.true;
          expect(self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent).to.have.been.called;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should save event on masterEventCache if and only if it is a recurring event', function() {
      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      this.event.isRecurring = _.constant(true);
      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });
      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true});

      this.$rootScope.$apply();
      this.$httpBackend.flush();

      this.event.isRecurring = _.constant(false);
      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });
      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true});

      this.$rootScope.$apply();
      this.$httpBackend.flush();
      expect(this.masterEventCache.save).to.have.been.calledOnce;
      expect(this.masterEventCache.save).to.have.been.calledWith(this.event);
    });

    it('should be able to modify an instance', function(done) {
      var occShell = this.event.clone();
      occShell.recurrenceId = this.fcMoment();

      var headers = { ETag: 'etag' };
      var vcalendar = angular.copy(this.vcalendar.toJSON());
      var $httpBackend = this.$httpBackend;

      this.gracePeriodService.grace = function() {
        return $q.when({ cancelled: false });
      };

      this.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      flushContext = {id: this.event.id};

      this.calendarService.modifyEvent('/path/to/uid.ics', occShell, occShell, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        function(completed) {
          expect(completed).to.be.true;
          done();
        }, unexpected.bind(null, done)
      );

      function checkPUT(data) {
        vcalendar = new ICAL.Component(JSON.parse(data));
        expect(vcalendar.getAllSubcomponents('vevent')).to.have.length(2);
        return true;
      }

      $httpBackend.whenGET('/dav/api/path/to/uid.ics').respond(200, vcalendar, headers);
      $httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY, checkPUT).respond(202, {id: '123456789'});
      $httpBackend.flush();
      this.$rootScope.$apply();
      $httpBackend.flush();
    });

    it('should send etag as If-Match header', function(done) {
      var requestHeaders = {
        'Content-Type': 'application/calendar+json',
        Prefer: 'return=representation',
        'If-Match': 'etag',
        Accept: 'application/json, text/plain, */*'
      };

      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar.toJSON(), requestHeaders).respond(202, { id: '123456789' }, { ETag: 'changed-etag' });
      this.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, this.vcalendar.toJSON());

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        function(shell) { done(); }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should reset the attendees participation if hasSignificantChange parameter is true', function(done) {
      var headers = { ETag: 'changed-etag' };
      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY, function(data) {
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

      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.oldEvent, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        function() {
          done();
        }, unexpected.bind(null, done)
      );
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should raise the sequence if hasSignificantChange parameter is true', function(done) {
      var headers = { ETag: 'changed-etag' };
      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY, function(data) {
        var vcalendar = new ICAL.Component(JSON.parse(data));
        var vevent = vcalendar.getFirstSubcomponent('vevent');
        expect(vevent.getFirstPropertyValue('sequence')).to.equal(1);
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

      this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.oldEvent, 'etag', angular.noop, {notifyFullcalendar: true}).then(
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

      this.gracePeriodService.cancel = function() {
        var deffered = $q.defer();
        deffered.resolve({});
        return deffered.promise;
      };

      var headers = { ETag: 'etag' };
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        function(response) {
          expect(self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent).to.have.been.called;
          expect(successSpy).to.have.been.called;
          expect(response).to.be.false;
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should cancel the task if event is involved in a graceperiod', function(done) {
      this.gracePeriodService.cancel = function() { done(); };
      var event = this.event.clone();
      event.gracePeriodTaskId = '12345';
      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', event, event, 'etag', angular.noop, {notifyFullcalendar: true});
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call given cancelCallback when graceperiod is cancelled before calling calendarEventEmitter.fullCalendar.emitModifiedEvent', function(done) {
      this.gracePeriodService.grace = function() {
        self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent = function() {
          expect(onCancel).to.have.been.calledOnce;
          done();
        };
        return $q.when({
          cancelled: true,
          success: angular.noop
        });
      };

      this.gracePeriodService.cancel = function() {
        var deffered = $q.defer();
        deffered.resolve({});
        return deffered.promise;
      };

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), { ETag: 'etag' });

      var onCancel = sinon.spy();

      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, this.event, 'etag', onCancel, {notifyFullcalendar: true});

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call cachedEventSource.registerUpdate', function(done) {

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), {ETag: 'etag'});

      var event = this.event;
      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', event, event, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        function() {
          expect(cachedEventSourceMock.registerUpdate).to.have.been.calledWith(event);
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call cachedEventSource.registerUpdate again with the oldEvent if the modification is cancelled', function(done) {

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var event = this.event;
      event.isRecurring = _.constant(true);
      var oldEvent = this.event.clone();

      var first = true;
      cachedEventSourceMock.registerUpdate = function(_event) {
        if (first) {
          expect(_event).to.equal(event);
          first = false;
        } else {
          expect(_event).to.equal(oldEvent);
          done();
        }
      };

      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', event, oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call masterEventCache.save on old event if the creation is cancelled if and only if oldEvent is recurring', function() {

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      var oldEvent = this.event.clone();

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      oldEvent.isRecurring = _.constant(true);
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});
      this.$rootScope.$apply();
      this.$httpBackend.flush();

      oldEvent.isRecurring = _.constant(false);
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});
      this.$rootScope.$apply();
      this.$httpBackend.flush();

      expect(this.masterEventCache.save).to.have.been.calledWith(sinon.match.same(oldEvent));
      expect(this.masterEventCache.save).to.have.been.calledOnce;
    });

    it('should never transmit empty error message to grace task even if the error message from the backend is empty', function(done) {
      var statusErrorText = '';
      var errorSpy = sinon.spy(function(error) {
        expect(error).to.be.not.empty;
      });

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          error: errorSpy
        });
      };

      this.gracePeriodService.cancel = function(taskId) {
        var deffered = $q.defer();
        deffered.reject({statusText: statusErrorText});
        return deffered.promise;
      };

      var headers = { ETag: 'etag' };
      this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

      this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, this.event, 'etag', angular.noop, {notifyFullcalendar: true}).catch(
        function() {
          expect(self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent).to.have.been.called;
          expect(errorSpy).to.have.been.called;
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    describe('handler for grace period error', function() {
      var handler;
      beforeEach(function() {
        this.gracePeriodLiveNotification.registerListeners = function(taskId, _handler) {
          handler = _handler;
        };

        this.oldEvent = this.event.clone();
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, this.oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should register an error handler for grace period error', function() {
        expect(handler).to.not.be.undefined;
      });

      it('should save oldEvent on masterEventCache if and only if it is a recurring event', function() {
        this.oldEvent.isRecurring = _.constant(true);
        handler();
        this.oldEvent.isRecurring = _.constant(false);
        handler();

        expect(this.masterEventCache.save).to.have.been.calledOnce;
        expect(this.masterEventCache.save).to.have.been.calledWith(this.oldEvent);
      });

      it('should emitModifiedEvent with the old event', function() {
        handler();
        expect(this.calendarEventEmitterMock.fullcalendar.emitModifiedEvent).to.have.been.calledWith(sinon.match.same(this.oldEvent));
      });
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
        start: this.fcMoment(),
        end: this.fcMoment(),
        isInstance: _.constant(false)
      };

      this.cloneOfMaster = {
        equals: _.constant(false),
        deleteInstance: sinon.spy()
      };

      this.master = {
        expand: _.constant({length: 2}),
        clone: sinon.stub().returns(this.cloneOfMaster)
      };

      this.instanceEvent = {
        isInstance: _.constant(true),
        getModifiedMaster: sinon.stub().returns($q.when(this.master))
      };

      flushContext = {id: this.event.id};
    });

    it('should fail if status is not 202', function(done) {
      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(201);

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
        unexpected.bind(null, done), function(response) {
          expect(response.status).to.equal(201);
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should cancel the task if there is no etag and if it is not a recurring', function(done) {
      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.gracePeriodService.cancel = function() {
        return $q.when();
      };

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event).then(
        function(completed) {
          expect(completed).to.be.true;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should cancel the task if event is involved in a graceperiod', function(done) {
      this.gracePeriodService.cancel = function() { done(); };
      var event = angular.copy(this.event);
      event.gracePeriodTaskId = '12345';
      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', event, 'etag');
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

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
        function(completed) {
          expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.called;
          expect(completed).to.be.true;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call cachedEventSource.registerDelete', function(done) {

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var event = this.event;
      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
        function() {
          expect(cachedEventSourceMock.registerDelete).to.have.been.calledWith(event);
          done();
        }
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should call cachedEventSource.deleteRegistration if the creation is cancelled', function(done) {

      this.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      this.gracePeriodService.cancel = $q.when.bind(null, {});

      var event = this.event;
      cachedEventSourceMock.deleteRegistration = function(_event) {
        expect(_event).to.equal(event);
        done();
      };

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag');
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
      this.gracePeriodService.cancel = function() {
        return $q.when({});
      };

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
        function(response) {
          expect(self.calendarEventEmitterMock.fullcalendar.emitCreatedEvent).to.have.been.called;
          expect(successSpy).to.have.been.called;
          expect(response).to.be.false;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should transmit an error message to grace task even if canceling the deletion fail', function(done) {
      var statusErrorText = '';
      var errorSpy = sinon.spy(function(error) {
        expect(error).to.be.not.empty;
      });

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          error: errorSpy
        });
      };

      this.gracePeriodService.cancel = function(taskId) {
        var deffered = $q.defer();
        deffered.reject({statusText: statusErrorText});
        return deffered.promise;
      };

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').catch(
        function() {
          expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.called;
          expect(errorSpy).to.have.been.called;
          done();
        });

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

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
        function(response) {
          expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.called;
          expect(registerSpy).to.have.been.called;
          expect(response).to.be.true;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should succeed on 202', function(done) {
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

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
        function(response) {
          expect(response).to.be.true;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should delegate on modifyEvent for instance of recurring after deleting subevent from master shell even if no etag', function() {
      var modifyEventAnswer = {};

      var successCallback = sinon.spy(function(response) {
        expect(response).to.equal(modifyEventAnswer);
        expect(self.instanceEvent.getModifiedMaster).to.have.been.calledOnce;
        expect(self.master.clone).to.have.been.calledOnce;
        expect(self.cloneOfMaster.deleteInstance).to.have.been.calledWith(self.instanceEvent);
      });

      var errorCallback = sinon.spy();

      this.calendarService.modifyEvent = sinon.stub().returns($q.when(modifyEventAnswer));
      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.instanceEvent, 'etag').then(
        successCallback, errorCallback
      );

      this.$rootScope.$apply();

      this.instanceEvent.getModifiedMaster.reset();
      this.master.clone.reset();

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.instanceEvent).then(
        successCallback, errorCallback
      );

      this.$rootScope.$apply();

      expect(successCallback).to.have.been.calledTwice;
      expect(errorCallback).to.not.been.called;
    });

    it('should remove master of event if event is the only instance of a recurring event', function(done) {
      var taskId = '123456789';
      this.master.expand = _.constant({length:1});

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.gracePeriodService.remove = function(id) {
        expect(taskId).to.equal(taskId);
      };

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.instanceEvent, 'etag').then(
        function(response) {
          expect(response).to.be.true;
          done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should remove master of event if removeAllInstance is true even if event is not the only instance of a recurring event', function(done) {
      var taskId = '123456789';

      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      this.gracePeriodService.remove = function(id) {
        expect(taskId).to.equal(taskId);
      };

      this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + this.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.instanceEvent, 'etag', true).then(
        function(response) {
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
      vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(this.fcMoment().toDate())).setParameter('tzid', this.jstz.determine().name());
      vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(this.fcMoment().toDate())).setParameter('tzid', this.jstz.determine().name());
      vevent.addPropertyWithValue('transp', 'OPAQUE');
      vevent.addPropertyWithValue('location', 'test location');
      vcalendar.addSubcomponent(vevent);
      this.vcalendar = vcalendar;
      this.event = new this.CalendarShell(this.vcalendar);
    });

    it('should return null if event.attendees is an empty array', function(done) {
      var emails = ['test@example.com'];
      this.event.attendees = [];

      this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'ACCEPTED').then(function(response) {
        expect(response).to.be.null;
        done();
      }, unexpected.bind(null, done));

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should change the participation status', function(done) {

      var emails = ['test@example.com'];
      var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
      var vevent = copy.getFirstSubcomponent('vevent');
      var att = vevent.addPropertyWithValue('attendee', 'mailto:test@example.com');
      att.setParameter('partstat', 'ACCEPTED');
      att.setParameter('rsvp', 'TRUE');
      att.setParameter('role', 'REQ-PARTICIPANT');

      this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON()).respond(200, this.vcalendar.toJSON());

      this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'ACCEPTED').then(
        function(response) { done(); }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should not change the participation status when the status is the actual attendee status', function(done) {
      var emails = ['test@example.com'];

      var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
      var vevent = copy.getFirstSubcomponent('vevent');
      var att = vevent.addPropertyWithValue('attendee', 'mailto:test@example.com');
      att.setParameter('partstat', 'DECLINED');
      att.setParameter('rsvp', 'TRUE');
      att.setParameter('role', 'REQ-PARTICIPANT');

      this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'DECLINED').then(
        function(response) {
          expect(response).to.be.null; done();
        }, unexpected.bind(null, done)
      );

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it.skip('should retry participation change on 412', function(done) {

      var emails = ['test@example.com'];
      var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
      var vevent = copy.getFirstSubcomponent('vevent');
      var att = vevent.getFirstProperty('attendee');
      att.setParameter('partstat', 'ACCEPTED');

      var requestHeaders = {
        'If-Match': 'etag',
        Prefer: 'return=representation',
        'Content-Type': 'application/calendar+json',
        Accept: 'application/json, text/plain, */*'
      };

      var conflictHeaders = {
        ETag: 'conflict'
      };

      var successRequestHeaders = {
        'If-Match': 'conflict',
        Prefer: 'return=representation',
        'Content-Type': 'application/calendar+json',
        Accept: 'application/json, text/plain, */*'
      };
      var successHeaders = {
        ETag: 'success'
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
