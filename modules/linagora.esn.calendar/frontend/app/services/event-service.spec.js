'use strict';

/* global chai, sinon, _, __FIXTURES__: false */

var expect = chai.expect;

describe('The calEventService service', function() {
  var ICAL, calCachedEventSourceMock, flushContext, self;

  beforeEach(function() {
    self = this;

    self.tokenAPI = {
      _token: '123',
      getNewToken: function() {
        var token = this._token;

        return $q.when({ data: { token: token } });
      }
    };

    calCachedEventSourceMock = {
      registerAdd: sinon.spy(),
      registerDelete: sinon.spy(),
      registerUpdate: sinon.spy(),
      deleteRegistration: sinon.spy()
    };

    self.gracePeriodService = {
      grace: function() {
        return $q.when();
      }
    };

    self.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };

    self.notificationFactoryMock = {
      weakInfo: sinon.spy(),
      weakError: sinon.spy()
    };

    self.jstz = {
      determine: function() {
        return {
          name: function() {
            return 'Europe/Paris';
          }};
      }
    };

    self.calendarEventEmitterMock = {
      activitystream: {
        emitPostedMessage: sinon.spy()
      },
      fullcalendar: {
        emitCreatedEvent: sinon.spy(),
        emitRemovedEvent: sinon.spy(),
        emitModifiedEvent: sinon.spy()
      }
    };

    angular.mock.module('esn.calendar');
    angular.mock.module('esn.ical');

    angular.mock.module(function($provide) {
      $provide.value('tokenAPI', self.tokenAPI);
      $provide.value('jstz', self.jstz);
      $provide.value('uuid4', self.uuid4);
      $provide.value('notificationFactory', self.notificationFactoryMock);
      $provide.value('socket', self.socket);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('$modal', self.$modal);
      $provide.value('calCachedEventSource', calCachedEventSourceMock);
      $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      $provide.value('gracePeriodLiveNotificationService', {start: angular.noop});
      $provide.decorator('calMasterEventCache', function($delegate) {
        self.calMasterEventCache = {
          get: $delegate.get,
          remove: sinon.spy($delegate.remove),
          save: sinon.spy($delegate.save)
        };

        return self.calMasterEventCache;
      });
    });
  });

  beforeEach(angular.mock.inject(function(calEventService, $httpBackend, $rootScope, _ICAL_, CalendarShell, calMoment, CALENDAR_EVENTS, CALENDAR_GRACE_DELAY) {
    self.$httpBackend = $httpBackend;
    self.$rootScope = $rootScope;
    self.calEventService = calEventService;
    self.CalendarShell = CalendarShell;
    self.calMoment = calMoment;
    ICAL = _ICAL_;
    self.CALENDAR_EVENTS = CALENDAR_EVENTS;
    self.CALENDAR_GRACE_DELAY = CALENDAR_GRACE_DELAY;
  }));

  describe('The listEvents fn', function() {

    it('should list non-recurring events', function(done) {
      var data = {
        match: { start: '20140101T000000', end: '20140102T000000' }
      };
      this.$httpBackend.expect('REPORT', '/dav/api/calendars/uid/events.json', data).respond({
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

      var start = self.calMoment(new Date(2014, 0, 1));
      var end = self.calMoment(new Date(2014, 0, 2));

      self.calEventService.listEvents('/calendars/uid/events.json', start, end, false).then(function(events) {
        expect(events).to.be.an.array;
        expect(events.length).to.equal(1);
        expect(events[0].id).to.equal('myuid');
        expect(events[0].uid).to.equal('myuid');
        expect(events[0].title).to.equal('title');
        expect(events[0].location).to.equal('location');
        expect(events[0].start.toDate()).to.equalDate(self.calMoment('2014-01-01 02:03:04').toDate());
        expect(events[0].end.toDate()).to.equalDate(self.calMoment('2014-01-01 03:03:04').toDate());
        expect(events[0].vcalendar).to.be.an('object');
        expect(events[0].vevent).to.be.an('object');
        expect(events[0].etag).to.equal('"123123"');
        expect(events[0].path).to.equal('/prepath/path/to/calendar/myuid.ics');
      }).finally(done);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });

    it('should list recurring events', function(done) {
      var data = {
        match: { start: '20140101T000000', end: '20140103T000000' }
      };
      this.$httpBackend.expect('REPORT', '/dav/api/calendars/uid/events.json', data).respond({
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

      var start = self.calMoment(new Date(2014, 0, 1));
      var end = self.calMoment(new Date(2014, 0, 3));

      self.calEventService.listEvents('/calendars/uid/events.json', start, end, false).then(function(events) {
        expect(events).to.be.an.array;
        expect(events.length).to.equal(2);
        expect(events[0].uid).to.equal('myuid');
        expect(events[0].isInstance()).to.be.true;
        expect(events[0].id).to.equal('myuid_2014-01-01T02:03:04Z');
        expect(events[0].start.toDate()).to.equalDate(self.calMoment('2014-01-01 02:03:04').toDate());
        expect(events[0].end.toDate()).to.equalDate(self.calMoment('2014-01-01 03:03:04').toDate());
        expect(events[0].vcalendar).to.be.an('object');
        expect(events[0].vevent).to.be.an('object');
        expect(events[0].etag).to.equal('"123123"');
        expect(events[0].path).to.equal('/prepath/path/to/calendar/myuid.ics');

        expect(events[1].uid).to.equal('myuid');
        expect(events[1].isInstance()).to.be.true;
        expect(events[1].id).to.equal('myuid_2014-01-02T02:03:04Z');
        expect(events[1].start.toDate()).to.equalDate(self.calMoment('2014-01-02 02:03:04').toDate());
        expect(events[1].end.toDate()).to.equalDate(self.calMoment('2014-01-02 03:03:04').toDate());
        expect(events[1].vcalendar).to.be.an('object');
        expect(events[1].vevent).to.be.an('object');
        expect(events[1].etag).to.equal('"123123"');
        expect(events[1].path).to.equal('/prepath/path/to/calendar/myuid.ics');
      }).finally(done);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });
  });

  describe('The getEvent fn', function() {

    it('should return an event', function(done) {
      // The caldav server will be hit
      self.$httpBackend.expectGET('/dav/api/path/to/event.ics').respond(
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

      self.calEventService.getEvent('/path/to/event.ics').then(function(event) {
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
            displayName: 'name',
            id: undefined
          },
          {
            fullmail: 'noname@example.com',
            email: 'noname@example.com',
            name: 'noname@example.com',
            partstat: 'DECLINED',
            displayName: 'noname@example.com',
            id: undefined
          },
          {
            fullmail: 'yolo@example.com',
            email: 'yolo@example.com',
            name: 'yolo@example.com',
            partstat: 'YOLO',
            displayName: 'yolo@example.com',
            id: undefined
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

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });
  });

  describe('The create fn', function() {
    function unexpected(done) {
      done(new Error('Unexpected'));
    }

    it('should fail on 500 response status', function() {
      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(500, '');

      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vcalendar.addSubcomponent(vevent);
      var event = new self.CalendarShell(vcalendar);

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      var catchSpy = sinon.spy();

      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).catch(catchSpy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(catchSpy).to.have.been.calledWith(sinon.match({status: 500}));
    });

    it('should fail on a 2xx status that is not 202', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vcalendar.addSubcomponent(vevent);
      var event = new self.CalendarShell(vcalendar);

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(200, '');

      var catchSpy = sinon.spy();

      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).catch(catchSpy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(catchSpy).to.have.been.calledWith(sinon.match({status: 200}));
    });

    it('should succeed when everything is correct and return true', function() {
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
      var calendarShell = new self.CalendarShell(vcalendar, {
        path: path,
        etag: etag
      });

      self.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };
      self.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal(gracePeriodTaskId);
      };

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: gracePeriodTaskId});

      var thenSpy = sinon.spy();

      self.calEventService.createEvent('calId', '/path/to/calendar', calendarShell, { graceperiod: true, notifyFullcalendar: true }).then(thenSpy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(thenSpy).to.have.been.calledWith(true);
      expect(self.calendarEventEmitterMock.fullcalendar.emitCreatedEvent).to.have.been.called;
    });

    it('should resolve false if the graceperiod fail (user cancel or error)', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vevent.addPropertyWithValue('dtend', '2015-05-25T09:56:29+00:00');
      vcalendar.addSubcomponent(vevent);

      var event = new self.CalendarShell(vcalendar);
      var gracePeriodTaskId = '123456789';

      self.gracePeriodService.grace = function() {
        return $q.reject({});
      };

      var headers = { ETag: 'etag' };

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: gracePeriodTaskId});

      var spy = sinon.spy();

      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(false);
      expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.called;
    });

    it('should call calCachedEventSource.registerAdd', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new self.CalendarShell(vcalendar);

      self.gracePeriodService.grace = $q.when.bind(null, {});

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var spy = sinon.spy();

      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true }).then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(calCachedEventSourceMock.registerAdd).to.have.been.calledWith(event);

      expect(spy).to.have.been.called;
    });

    it('should call calMasterEventCache.save if and only if it is a recurring event', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new self.CalendarShell(vcalendar);

      event.isRecurring = _.constant(true);

      self.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      self.gracePeriodService.cancel = $q.when.bind(null, {});

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });

      self.$rootScope.$apply();
      self.$httpBackend.flush();

      event.isRecurring = _.constant(false);

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });

      self.$rootScope.$apply();
      self.$httpBackend.flush();

      expect(self.calMasterEventCache.save).to.have.been.calledOnce;
      expect(self.calMasterEventCache.save).to.have.been.calledWith(event);
    });

    it('should call calCachedEventSource.deleteRegistration if the creation is cancelled', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new self.CalendarShell(vcalendar);

      self.gracePeriodService.grace = $q.reject.bind(null, {});

      calCachedEventSourceMock.deleteRegistration = sinon.spy();

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });
      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(calCachedEventSourceMock.deleteRegistration).to.have.been.calledWith(event);
    });

    it('should call calMasterEventCache.remove if the creation is cancelled and if and only if event is a recurring event', function() {
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');

      vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
      vevent.addPropertyWithValue('dtstart', '2015-05-25T08:56:29+00:00');
      vcalendar.addSubcomponent(vevent);
      var event = new self.CalendarShell(vcalendar);

      self.gracePeriodService.grace = $q.reject.bind(null, {});

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      event.isRecurring = _.constant(true);
      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });
      self.$rootScope.$apply();
      self.$httpBackend.flush();

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      event.isRecurring = _.constant(false);
      self.calEventService.createEvent('calId', '/path/to/calendar', event, { graceperiod: true });
      self.$rootScope.$apply();
      self.$httpBackend.flush();

      expect(self.calMasterEventCache.remove).to.have.been.calledOnce;
      expect(self.calMasterEventCache.remove).to.have.been.calledWith(event);
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
      self.vcalendar = vcalendar;
      self.vevent = vevent;

      self.event = new self.CalendarShell(self.vcalendar, {
        path: '/path/to/uid.ics'
      });
      self.oldEvent = self.event.clone();
      self.oldEvent.start = self.event.start.clone().add(1, 'hour');

      flushContext = {
        id: self.event.id
      };
    });

    it('should fail if status is not 202', function(done) {
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(200);

      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(
        unexpected.bind(null, done), function(response) {
          expect(response.status).to.equal(200);
          done();
        }
      );

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });

    it('should succeed on 202 and return true', function() {
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });

      self.gracePeriodService.grace = function() {
        return $q.when({});
      };

      var spy = sinon.spy();

      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent).to.have.been.called;
    });

    it('should save event on calMasterEventCache if and only if it is a recurring event', function() {
      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.event.isRecurring = _.constant(true);
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });
      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.event, 'etag', angular.noop, {notifyFullcalendar: true});

      self.$rootScope.$apply();
      self.$httpBackend.flush();

      self.event.isRecurring = _.constant(false);
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });
      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.event, 'etag', angular.noop, {notifyFullcalendar: true});

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(self.calMasterEventCache.save).to.have.been.calledOnce;
      expect(self.calMasterEventCache.save).to.have.been.calledWith(self.event);
    });

    it('should be able to modify an instance', function() {
      var occShell = this.event.clone();

      occShell.recurrenceId = this.calMoment([2017, 1, 1, 1, 1]);
      occShell.start = occShell.start.add(30, 'minutes');

      var headers = { ETag: 'etag' };
      var vcalendar = _.cloneDeep(self.vcalendar.toJSON());
      var $httpBackend = self.$httpBackend;

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      this.gracePeriodService.remove = sinon.spy();

      flushContext = {id: self.event.id};

      var modifyEventThen = sinon.spy();

      this.calEventService.modifyEvent('/path/to/uid.ics', occShell, occShell, 'etag', angular.noop, {notifyFullcalendar: true}).then(modifyEventThen);

      function checkPUT(data) {
        vcalendar = new ICAL.Component(JSON.parse(data));

        return vcalendar.getAllSubcomponents('vevent').length === 2;
      }

      $httpBackend.whenGET('/dav/api/path/to/uid.ics').respond(200, vcalendar, headers);
      $httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY, checkPUT).respond(202, {id: '123456789'});
      $httpBackend.flush();
      this.$rootScope.$apply();
      expect(modifyEventThen).to.have.been.calledWith(true);
    });

    it('should send etag as If-Match header', function() {
      var requestHeaders = {
        'Content-Type': 'application/calendar+json',
        Prefer: 'return=representation',
        'If-Match': 'etag',
        Accept: 'application/json, text/plain, */*'
      };

      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY, self.vcalendar.toJSON(), requestHeaders).respond(202, { id: '123456789' }, { ETag: 'changed-etag' });

      self.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      self.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      var spy = sinon.spy();

      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.event, 'etag', angular.noop, {notifyFullcalendar: true}).then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(true);

    });

    it('should reset the attendees participation if hasSignificantChange parameter is true', function() {
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY, function(data) {
        var vcalendar = new ICAL.Component(JSON.parse(data));
        var vevent = vcalendar.getFirstSubcomponent('vevent');

        vevent.getAllProperties('attendee').forEach(function(att) {
          expect(att.getParameter('partstat')).to.equal('NEEDS-ACTION');
        });

        return true;
      }).respond(202, { id: '123456789' });

      self.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: false
        });
      };

      var spy = sinon.spy();

      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.oldEvent, 'etag', angular.noop, {notifyFullcalendar: true}).then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(true);
    });

    it('should raise the sequence if hasSignificantChange parameter is true', function() {
      var headers = { ETag: 'changed-etag' };

      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY, function(data) {
        var vcalendar = new ICAL.Component(JSON.parse(data));
        var vevent = vcalendar.getFirstSubcomponent('vevent');

        expect(vevent.getFirstPropertyValue('sequence')).to.equal(1);

        return true;
      }).respond(202, { id: '123456789' });

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      var spy = sinon.spy();

      self.calEventService.modifyEvent('/path/to/uid.ics', self.event, self.oldEvent, 'etag', angular.noop, {notifyFullcalendar: true}).then(spy);
      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(true);

    });

    it('should cancel the task if event is involved in a graceperiod', function() {
      self.gracePeriodService.cancel = sinon.spy();
      var gracePeriodTaskId, event = self.event.clone();

      gracePeriodTaskId = event.gracePeriodTaskId = '12345';
      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, { id: '123456789' });
      self.calEventService.modifyEvent('/path/to/calendar/uid.ics', event, event, 'etag', angular.noop, {notifyFullcalendar: true});
      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(self.gracePeriodService.cancel).to.have.been.calledWith(gracePeriodTaskId);
    });

    it('should call given cancelCallback when graceperiod is cancelled before calling calendarEventEmitter.fullCalendar.emitModifiedEvent', function() {

      self.gracePeriodService.grace = function() {
        self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent = sinon.spy();

        return $q.reject();
      };

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var onCancel = sinon.spy();

      self.calEventService.modifyEvent('/path/to/calendar/uid.ics', self.event, self.event, 'etag', onCancel, {notifyFullcalendar: true});

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(onCancel).to.have.been.calledOnce;
      expect(self.calendarEventEmitterMock.fullcalendar.emitModifiedEvent).to.have.been.calledOnce;
    });

    it('should call calCachedEventSource.registerUpdate', function() {

      self.gracePeriodService.grace = $q.when.bind(null, {
        cancelled: true,
        success: angular.noop
      });

      self.gracePeriodService.cancel = $q.when.bind(null, {});

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var event = self.event;
      var spy = sinon.spy();

      self.calEventService.modifyEvent('/path/to/calendar/uid.ics', event, event, 'etag', angular.noop, {notifyFullcalendar: true}).then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(calCachedEventSourceMock.registerUpdate).to.have.been.calledWith(event);
      expect(spy).to.have.been.calledOnce;
    });

    it('should call calCachedEventSource.registerUpdate again with the oldEvent if the modification is cancelled', function() {

      self.gracePeriodService.grace = $q.reject.bind(null);

      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var event = self.event;

      event.isRecurring = _.constant(true);
      var oldEvent = self.event.clone();

      calCachedEventSourceMock.registerUpdate = sinon.spy();

      self.calEventService.modifyEvent('/path/to/calendar/uid.ics', event, oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(calCachedEventSourceMock.registerUpdate.firstCall).to.have.been.calledWith(sinon.match.same(event));
      expect(calCachedEventSourceMock.registerUpdate.secondCall).to.have.been.calledWith(sinon.match.same(oldEvent));
    });

    it('should call calMasterEventCache.save on old event if the creation is cancelled if and only if oldEvent is recurring', function() {

      self.gracePeriodService.grace = $q.reject.bind(null);

      var oldEvent = self.event.clone();

      oldEvent.isRecurring = _.constant(true);
      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      self.calEventService.modifyEvent('/path/to/calendar/uid.ics', self.event, oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});
      self.$rootScope.$apply();
      self.$httpBackend.flush();

      oldEvent.isRecurring = _.constant(false);
      self.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});
      self.calEventService.modifyEvent('/path/to/calendar/uid.ics', self.event, oldEvent, 'etag', angular.noop, {notifyFullcalendar: true});
      self.$rootScope.$apply();
      self.$httpBackend.flush();

      expect(self.calMasterEventCache.save).to.have.been.calledWith(sinon.match.same(oldEvent));
      expect(self.calMasterEventCache.save).to.have.been.calledOnce;
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

      self.vcalendar = vcalendar;

      self.event = {
        id: '00000000-0000-4000-a000-000000000000',
        title: 'test event',
        start: self.calMoment(),
        end: self.calMoment(),
        isInstance: _.constant(false)
      };

      self.cloneOfMaster = {
        equals: _.constant(false),
        deleteInstance: sinon.spy()
      };

      self.master = {
        expand: _.constant({length: 2}),
        clone: sinon.stub().returns(self.cloneOfMaster)
      };

      self.instanceEvent = {
        isInstance: _.constant(true),
        getModifiedMaster: sinon.stub().returns($q.when(self.master))
      };

      flushContext = {id: self.event.id};
    });

    it('should fail if status is not 202', function() {
      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(201);

      var errorSpy = sinon.spy();

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.event, 'etag').catch(errorSpy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(errorSpy).to.have.been.calledWith(sinon.match({status: 201}));
    });

    it('should cancel the task if there is no etag and if it is not a recurring', function() {
      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.gracePeriodService.cancel = sinon.spy(function() {
        return $q.when();
      });

      var thenSpy = sinon.spy();

      self.event.gracePeriodTaskId = 'taskId';
      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.event).then(thenSpy);

      self.$rootScope.$apply();
      expect(thenSpy).to.have.been.calledWith(true);
      expect(calCachedEventSourceMock.deleteRegistration).to.have.been.calledWith(self.event);
      expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.calledWith(self.event.id);
      expect(self.gracePeriodService.cancel).to.have.been.calledWith(self.event.gracePeriodTaskId);
      expect(self.notificationFactoryMock.weakInfo).to.have.been.calledWith('Calendar', self.event.title + ' has been deleted.');
    });

    it('should cancel the task if event is involved in a graceperiod', function() {
      self.gracePeriodService.cancel = sinon.spy();
      var event = angular.copy(self.event);

      var gracePeriodId = event.gracePeriodTaskId = '12345';
      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', event, 'etag');
      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(201);
      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(self.gracePeriodService.cancel).to.have.been.calledWith(gracePeriodId);
    });

    it('should succeed on 202 and send a websocket event', function() {

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.gracePeriodService.remove = function(taskId) {
        expect(taskId).to.equal('123456789');
      };

      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      var spy = sinon.spy();
      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.event, 'etag').then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(true);
      expect(self.calendarEventEmitterMock.fullcalendar.emitRemovedEvent).to.have.been.called;
    });

    it('should call calCachedEventSource.registerDelete', function() {
      var spy = sinon.spy();

      self.gracePeriodService.grace = $q.when.bind(null);
      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.event, 'etag').then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(calCachedEventSourceMock.registerDelete).to.have.been.calledWith(self.event);
      expect(spy).to.have.been.calledWith(true);
    });

    it('should call calCachedEventSource.deleteRegistration if the creation is cancelled', function() {
      self.gracePeriodService.grace = $q.reject.bind(null);

      calCachedEventSourceMock.deleteRegistration = sinon.spy();

      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: '123456789'});

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.event, 'etag');
      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(calCachedEventSourceMock.deleteRegistration).to.have.been.calledWith(self.event);
    });

    it('should succeed on 202', function() {
      var taskId = '123456789';

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      var spy = sinon.spy();

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.event, 'etag').then(spy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(true);
    });

    it('should delegate on modifyEvent for instance of recurring after deleting subevent from master shell even if no etag', function() {
      var modifyEventAnswer = {};

      var successCallback = sinon.spy();

      self.calEventService.modifyEvent = sinon.stub().returns($q.when(modifyEventAnswer));
      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.instanceEvent, 'etag').then(successCallback);

      self.$rootScope.$apply();

      self.instanceEvent.getModifiedMaster.reset();
      self.master.clone.reset();

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.instanceEvent).then(successCallback);

      self.$rootScope.$apply();

      expect(successCallback).to.have.been.calledTwice;
      expect(successCallback).to.have.been.always.calledWith(sinon.match.same(modifyEventAnswer));
      expect(self.instanceEvent.getModifiedMaster).to.have.been.calledOnce;
      expect(self.master.clone).to.have.been.calledOnce;
      expect(self.cloneOfMaster.deleteInstance).to.have.been.calledWith(self.instanceEvent);
    });

    it('should remove master of event if event is the only instance of a recurring event', function() {
      var taskId = '123456789';

      self.master.expand = _.constant({length: 1});

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      var thenSpy = sinon.spy();

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.instanceEvent, 'etag').then(thenSpy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(thenSpy).to.have.been.calledWith(true);
    });

    it('should remove master of event if removeAllInstance is true even if event is not the only instance of a recurring event', function() {
      var taskId = '123456789';

      self.gracePeriodService.grace = function() {
        return $q.when();
      };

      self.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=' + self.CALENDAR_GRACE_DELAY).respond(202, {id: taskId});

      var thenSpy = sinon.spy();

      self.calEventService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', self.instanceEvent, 'etag', true).then(thenSpy);

      self.$rootScope.$apply();
      self.$httpBackend.flush();
      expect(thenSpy).to.have.been.calledWith(true);
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
      vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(self.calMoment().toDate())).setParameter('tzid', self.jstz.determine().name());
      vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(self.calMoment().toDate())).setParameter('tzid', self.jstz.determine().name());
      vevent.addPropertyWithValue('transp', 'OPAQUE');
      vevent.addPropertyWithValue('location', 'test location');
      vcalendar.addSubcomponent(vevent);
      self.vcalendar = vcalendar;
      self.event = new self.CalendarShell(self.vcalendar);
    });

    it('should return null if event.attendees is an empty array', function(done) {
      var emails = ['test@example.com'];

      self.event.attendees = [];

      self.calEventService.changeParticipation('/path/to/uid.ics', self.event, emails, 'ACCEPTED').then(function(response) {
        expect(response).to.be.null;
        done();
      }, unexpected.bind(null, done));

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });

    it('should change the participation status', function(done) {

      var emails = ['test@example.com'];
      var copy = new ICAL.Component(ICAL.helpers.clone(self.vcalendar.jCal, true));
      var vevent = copy.getFirstSubcomponent('vevent');
      var att = vevent.addPropertyWithValue('attendee', 'mailto:test@example.com');

      att.setParameter('partstat', 'ACCEPTED');
      att.setParameter('rsvp', 'TRUE');
      att.setParameter('role', 'REQ-PARTICIPANT');
      self.event.attendees = [{emails: emails}];
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON()).respond(200, new ICAL.Component('vcalendar').jCal);

      self.calEventService.changeParticipation('/path/to/uid.ics', self.event, emails, 'ACCEPTED').then(
        function(response) {
          expect(response).to.exist;
          done();
        }, unexpected.bind(null, done)
      );

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });

    it('should not change the participation status when the status is the actual attendee status', function() {
      var emails = ['test@example.com'];

      var promiseSpy = sinon.spy();

      self.event.attendees = [{emails: emails, partstat: 'DECLINED'}];
      self.calEventService.changeParticipation('/path/to/uid.ics', self.event, emails, 'DECLINED').then(promiseSpy);

      self.$rootScope.$apply();
      expect(promiseSpy).to.have.been.calledWith(null);
    });

    it.skip('should retry participation change on 412', function(done) {

      var emails = ['test@example.com'];
      var copy = new ICAL.Component(ICAL.helpers.clone(self.vcalendar.jCal, true));
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

      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON(), requestHeaders).respond(412, self.vcalendar.toJSON(), conflictHeaders);
      self.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, self.vcalendar.toJSON(), conflictHeaders);
      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', copy.toJSON(), successRequestHeaders).respond(200, self.vcalendar.toJSON(), successHeaders);

      self.calEventService.changeParticipation('/path/to/uid.ics', self.event, emails, 'ACCEPTED', 'etag').then(
        function(shell) {
          expect(shell.etag).to.equal('success');
          done();
        }, unexpected.bind(null, done)
      );

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });

    it('should change the participation status if the event is recurrent', function(done) {
      var recurrentCalendarShell = new self.CalendarShell(new ICAL.Component(ICAL.parse(__FIXTURES__['modules/linagora.esn.calendar/frontend/app/fixtures/calendar/reventWithTz.ics'])), {path: '/path/to/uid.ics'});

      recurrentCalendarShell.attendees = [{email: 'test@example.com'}];
      var instance = recurrentCalendarShell.expand()[1];

      var emails = ['test@example.com'];
      var copy = new ICAL.Component(ICAL.helpers.clone(recurrentCalendarShell.vcalendar.jCal, true));
      var vevent = copy.getFirstSubcomponent('vevent');

      vevent.removeAllProperties('attendee');

      var att = vevent.addPropertyWithValue('attendee', 'mailto:test@example.com');

      att.setParameter('partstat', 'ACCEPTED');
      att.setParameter('rsvp', 'TRUE');
      att.setParameter('role', 'REQ-PARTICIPANT');

      self.$httpBackend.expectGET('/dav/api/path/to/uid.ics').respond(200, JSON.stringify(recurrentCalendarShell.vcalendar.jCal));

      self.$httpBackend.expectPUT('/dav/api/path/to/uid.ics', function(jCal) {
        //all of this is about removing an exception that is not a real exception
        //because it does not differ at all about the normal instance
        //it's here because of a issue of calendarshell that does not have real impact
        // Opened Issue : CAL-359
        var icsComponent = new ICAL.Component(JSON.parse(jCal));
        var idOfWrongException = instance.vevent.getFirstPropertyValue('recurrence-id');

        icsComponent.getAllSubcomponents('vevent').forEach(function(subVevent) {
          var subEventRecurrentId = subVevent.getFirstPropertyValue('recurrence-id');

          if (subEventRecurrentId && subEventRecurrentId.compare(idOfWrongException) === 0) {
            icsComponent.removeSubcomponent(subVevent);
          }
        });

        return icsComponent.toString() === copy.toString();
      }).respond(200, new ICAL.Component('vcalendar').jCal);

      self.calEventService.changeParticipation('/path/to/uid.ics', instance, emails, 'ACCEPTED').then(
        function(response) {
          expect(response).to.exist;
          done();
        }, unexpected.bind(null, done)
      );

      self.$rootScope.$apply();
      self.$httpBackend.flush();
    });

    // Everything else is covered by the modify fn
  });
});
