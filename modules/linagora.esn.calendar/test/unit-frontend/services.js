'use strict';

/* global chai: false */
/* global moment: false */

var expect = chai.expect;

describe('The Calendar Angular module services', function() {
  describe('The calendarEventSource', function() {
    beforeEach(function() {

      this.tokenAPI = {
        _token: '123',
        getNewToken: function() {
          var token = this._token;
          return {
            then: function(callback) {
              callback({ data: { token: token } });
            }
          };
        }
      };

      var self = this;
      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
      });

      angular.mock.inject(function(calendarEventSource, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.calendarEventSource = calendarEventSource;
      });
    });

    it('should use the correct path', function(done) {
        this.$httpBackend.whenGET('/davserver/api/info').respond({ url: ''});
        var data = {
          match: { start: '20140101T000000', end: '20140102T000000' }
        };
        this.$httpBackend.expectPOST('/calendars/test/events.json', data).respond({
          '_links': { 'self': { 'href': '/path/to/calendar.json' } },
          '_embedded': { 'dav:item': [] }
        });

        var start = new Date(2014, 0, 1);
        var end = new Date(2014, 0, 2);

        var source = this.calendarEventSource('test');

        source(start, end, false, function(events) {
          // Just getting here is fine, the http backend will check for the
          // right URL.
          done();
        });
        this.$httpBackend.flush();
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

  describe('The eventService service', function() {
    var element, fcTitle, fcContent, event;

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

    beforeEach(function() {
      var asSession = {
        user: {
          _id: '123456',
          emails: ['aAttendee@open-paas.org']
        },
        domain: {
          company_name: 'test'
        }
      };

      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('session', asSession);
      });

      var vcalendar = {};
      vcalendar.hasOwnProperty = null; // jshint ignore:line
      event = {
        title: 'myTitle',
        description: 'description',
        location: 'location',
        vcalendar: vcalendar
      };

      event.attendeesPerPartstat = {
        'NEEDS-ACTION': []
      };
      element = new Element();
      fcContent = new Element();
      fcTitle = new Element();
      element.innerElements['.fc-content'] = fcContent;
      element.innerElements['.fc-title'] = fcTitle;
    });

    beforeEach(angular.mock.inject(function(eventService) {
      this.eventService = eventService;
    }));

    describe('render function', function() {
      it('should add ellipsis class to .fc-content', function() {
        this.eventService.render(event, element);
        expect(fcContent.class).to.deep.equal(['ellipsis']);
      });

      it('should add ellipsis to .fc-title if location is defined and redefined the content html', function() {
        event.location = 'aLocation';
        this.eventService.render(event, element);
        expect(fcTitle.class).to.deep.equal(['ellipsis']);
        expect(fcTitle.htmlContent).to.equal('aContent (aLocation)');
      });

      it('should add a title attribute if description is defined', function() {
        event.description = 'aDescription';
        this.eventService.render(event, element);
        expect(element.attributes.title).to.equal('aDescription');
      });

      it('should add event-needs-action class if current user is found in the needs-action attendees', function() {
        event.attendeesPerPartstat['NEEDS-ACTION'].push({
          email: 'aAttendee@open-paas.org'
        });
        this.eventService.render(event, element);
        expect(element.class).to.deep.equal(['event-needs-action', 'event-common']);
      });

      it('should add event-common class otherwise', function() {
        this.eventService.render(event, element);
        expect(element.class).to.deep.equal(['event-accepted', 'event-common']);
      });

      it('should create a copy of an eventObject ', function() {
        var copy = {};
        this.eventService.copyEventObject(event, copy);
        expect(copy).to.deep.equal(event);
      });

      it('should copy non standard properties of an eventObject ', function() {
        event.attendees = ['attendee1', 'attendee2'];
        var copy = {};
        this.eventService.copyNonStandardProperties(event, copy);
        expect(copy.location).to.deep.equal(event.location);
        expect(copy.description).to.deep.equal(event.description);
        expect(copy.attendees).to.deep.equal(event.attendees);
        expect(copy.attendeesPerPartstat).to.deep.equal(event.attendeesPerPartstat);
      });
    });

    describe('isOrganizer function', function() {
      it('should return true when the event organizer is the current user', function() {
        var event = {
          organizer: {
            email: 'aAttendee@open-paas.org'
          }
        };
        expect(this.eventService.isOrganizer(event)).to.be.true;
      });

      it('should return false when the event organizer is not the current user', function() {
        var event = {
          organizer: {
            email: 'not-organizer@bar.com'
          }
        };
        expect(this.eventService.isOrganizer(event)).to.be.false;
      });

      it('should return true when the event is undefined', function() {
        expect(this.eventService.isOrganizer(null)).to.be.true;
      });

      it('should return true when the event organizer is undefined', function() {
        var event = {
          organizer: null
        };
        expect(this.eventService.isOrganizer(event)).to.be.true;
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
          return {
            then: function(callback) {
              callback({ data: { token: token } });
            }
          };
        }
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

      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
        $provide.value('jstz', self.jstz);
        $provide.value('uuid4', self.uuid4);
        $provide.value('socket', self.socket);
      });
    });

    beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, _ICAL_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$rootScope.$emit = function(message) {
        emitMessage = message;
      };
      this.calendarService = calendarService;

      ICAL = _ICAL_;
    }));

    describe('The list fn', function() {
      it('should list events', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        var data = {
          match: { start: '20140101T000000', end: '20140102T000000' }
        };
        this.$httpBackend.expectPOST('/path/to/calendar.json', data).respond({
          '_links': {
            'self': { 'href': '/path/to/calendar.json' }
          },
          '_embedded': {
            'dav:item': [{
              '_links': {
                'self': { 'href': '/path/to/calendar/myuid.ics' }
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

        var start = new Date(2014, 0, 1);
        var end = new Date(2014, 0, 2);

        this.calendarService.list('/path/to/calendar', start, end, false).then(function(events) {
            expect(events).to.be.an.array;
            expect(events.length).to.equal(1);
            expect(events[0].id).to.equal('myuid');
            expect(events[0].title).to.equal('title');
            expect(events[0].location).to.equal('location');
            expect(events[0].start.toDate()).to.equalDate(moment('2014-01-01 02:03:04').toDate());
            expect(events[0].end.toDate()).to.equalDate(moment('2014-01-01 03:03:04').toDate());
            expect(events[0].vcalendar).to.be.an('object');
            expect(events[0].etag).to.equal('"123123"');
            expect(events[0].path).to.equal('/path/to/calendar/myuid.ics');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The getEvent fn', function() {
      it('should return an event', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectGET('/path/to/event.ics').respond(
          ['vcalendar', [], [
            ['vevent', [
              ['uid', {}, 'text', 'myuid'],
              ['summary', {}, 'text', 'title'],
              ['location', {}, 'text', 'location'],
              ['dtstart', {}, 'date-time', '2014-01-01T02:03:04'],
              ['dtend', {}, 'date-time', '2014-01-01T03:03:04'],
              ['attendee', { 'x-rse-id': 1, 'partstat': 'ACCEPTED', 'cn': 'name' }, 'cal-address', 'mailto:test@example.com'],
              ['attendee', { 'x-rse-id': 2, 'partstat': 'DECLINED' }, 'cal-address', 'mailto:noname@example.com'],
              ['attendee', { 'x-rse-id': 3, 'partstat': 'TENTATIVE' }, 'cal-address', 'mailto:tentative@example.com'],
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

          expect(event.attendeesPerPartstat.ACCEPTED.length).to.equal(1);
          expect(event.attendeesPerPartstat.ACCEPTED[0].fullmail).to.equal('name <test@example.com>');
          expect(event.attendeesPerPartstat.ACCEPTED[0].email).to.equal('test@example.com');
          expect(event.attendeesPerPartstat.ACCEPTED[0].name).to.equal('name');
          expect(event.attendeesPerPartstat.ACCEPTED[0].partstat).to.equal('ACCEPTED');

          expect(event.attendeesPerPartstat.DECLINED.length).to.equal(1);
          expect(event.attendeesPerPartstat.DECLINED[0].fullmail).to.equal('noname@example.com');
          expect(event.attendeesPerPartstat.DECLINED[0].email).to.equal('noname@example.com');
          expect(event.attendeesPerPartstat.DECLINED[0].name).to.equal('noname@example.com');
          expect(event.attendeesPerPartstat.DECLINED[0].partstat).to.equal('DECLINED');

          expect(event.attendeesPerPartstat.OTHER.length).to.equal(1);
          expect(event.attendeesPerPartstat.OTHER[0].fullmail).to.equal('tentative@example.com');
          expect(event.attendeesPerPartstat.OTHER[0].partstat).to.equal('TENTATIVE');
          expect(event.attendees).to.deep.equal([
            {
              id: 1,
              fullmail: 'name <test@example.com>',
              email: 'test@example.com',
              name: 'name',
              partstat: 'ACCEPTED',
              displayName: 'name'
            },
            {
              id: 2,
              fullmail: 'noname@example.com',
              email: 'noname@example.com',
              name: 'noname@example.com',
              partstat: 'DECLINED',
              displayName: 'noname@example.com'
            },
            {
              id: 3,
              fullmail: 'tentative@example.com',
              email: 'tentative@example.com',
              name: 'tentative@example.com',
              partstat: 'TENTATIVE',
              displayName: 'tentative@example.com'
            }]);

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
        this.calendarService.create('/path/to/uid.ics', vcalendar).then(
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

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          unexpected.bind(null, done), function(e) {
            expect(e.message).to.equal('Missing UID in VEVENT');
            done();
          }
        );
        this.$rootScope.$apply();
      });

      it('should fail on 500 response status', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(500, '');

        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(500);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should fail on a 2xx status that is not 201', function(done) {
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcalendar.addSubcomponent(vevent);

        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, '');

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(200);
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
        vcalendar.addSubcomponent(vevent);


        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(201, vcalendar.toJSON());
        emitMessage = null;

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          function(response) {
            expect(response.status).to.equal(201);
            expect(response.data).to.deep.equal(vcalendar.toJSON());
            expect(emitMessage).to.equal('addedCalendarItem');
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
        var vcalendar = new ICAL.Component('vcalendar');
        var vevent = new ICAL.Component('vevent');
        vevent.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vevent.addPropertyWithValue('summary', 'test event');
        vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date())).setParameter('tzid', 'Europe/Paris');
        vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date())).setParameter('tzid', 'Europe/Paris');
        vevent.addPropertyWithValue('transp', 'OPAQUE');
        vcalendar.addSubcomponent(vevent);
        this.vcalendar = vcalendar;
        this.event = {
          id: '00000000-0000-4000-a000-000000000000',
          title: 'test event',
          start: moment(),
          end: moment()
        };

        this.$httpBackend.whenGET('/davserver/api/info').respond({ url: ''});
      });

      it('should fail if status is 201', function(done) {
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(201, this.vcalendar.toJSON());

        this.calendarService.modify('/path/to/uid.ics', this.event).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 200 without emitMessage', function(done) {
        emitMessage = null;
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), { 'ETag': 'changed-etag' });

        this.calendarService.modify('/path/to/uid.ics', this.event).then(
          function(shell) {
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('changed-etag');
            expect(shell.vcalendar.toJSON()).to.deep.equal(this.vcalendar.toJSON());
            expect(emitMessage).to.be.null;
            done();
          }.bind(this), unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204', function(done) {
        emitMessage = null;
        var headers = { 'ETag': 'changed-etag' };
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(204, '');
        this.$httpBackend.expectGET('/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

        this.calendarService.modify('/path/to/uid.ics', this.event).then(
          function(shell) {
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('changed-etag');
            expect(emitMessage).to.equal('modifiedCalendarItem');
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204 and send an "event:updated" message into the websocket', function(done) {
        emitMessage = null;
        var headers = { 'ETag': 'changed-etag' };
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(204, '');
        this.$httpBackend.expectGET('/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

        this.socketEmit = function(event, data) {
          expect(event).to.equal('event:updated');
          expect(data).to.deep.equal(this.calendarService.shellToICAL(this.event));
        };

        this.calendarService.modify('/path/to/uid.ics', this.event).then(
          function() {
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should send etag as If-Match header', function(done) {
        var requestHeaders = {
          'Content-Type': 'application/calendar+json',
          'Prefer': 'return-representation',
          'If-Match': 'etag',
          'ESNToken': '123',
          'Accept': 'application/json, text/plain, */*'
        };
        this.$httpBackend.expectPUT('/path/to/uid.ics', this.vcalendar.toJSON(), requestHeaders).respond(200, this.vcalendar.toJSON(), { 'ETag': 'changed-etag' });

        this.calendarService.modify('/path/to/uid.ics', this.event, 'etag').then(
          function(shell) { done(); }, unexpected.bind(null, done)
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

        this.$httpBackend.whenGET('/davserver/api/info').respond({ url: ''});
      });

      it('should fail if status is not 204', function(done) {
        this.$httpBackend.expectDELETE('/path/to/00000000-0000-4000-a000-000000000000.ics').respond(201);

        this.calendarService.remove('/path/to/', this.event).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204', function(done) {
        emitMessage = null;
        this.$httpBackend.expectDELETE('/path/to/00000000-0000-4000-a000-000000000000.ics').respond(204);
        this.socketEmit = function(event, data) {
          expect(event).to.equal('event:deleted');
          expect(data).to.deep.equal(this.calendarService.shellToICAL(this.event));
        };

        this.calendarService.remove('/path/to/', this.event).then(
          function(response) {
            expect(response.status).to.equal(204);
            expect(emitMessage).to.equal('removedCalendarItem');
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should send etag as If-Match header', function(done) {
        var requestHeaders = {
          'If-Match': 'etag',
          'ESNToken': '123',
          'Accept': 'application/json, text/plain, */*'
        };
        this.$httpBackend.expectDELETE('/path/to/00000000-0000-4000-a000-000000000000.ics', requestHeaders).respond(204);

        this.calendarService.remove('/path/to/', this.event, 'etag').then(
          function() { done(); }, unexpected.bind(null, done)
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

        this.$httpBackend.whenGET('/davserver/api/info').respond({ url: ''});
      });

      it('should change the participation status', function(done) {

        var emails = ['test@example.com'];
        var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
        var vevent = copy.getFirstSubcomponent('vevent');
        var att = vevent.getFirstProperty('attendee');
        att.setParameter('partstat', 'ACCEPTED');

        this.$httpBackend.expectPUT('/path/to/uid.ics', copy.toJSON()).respond(200, this.vcalendar.toJSON());

        this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'ACCEPTED').then(
          function(response) { done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should not change the participation status when the status is the actual attendee status', function(done) {
        var emails = ['test@example.com'];

        this.calendarService.changeParticipation('/path/to/uid.ics', this.event, emails, 'DECLINED').then(
          function(response) { done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      // Everything else is covered by the modify fn
    });

    describe('The shellToICAL fn', function() {

      it('should correctly create an allday event', function() {
        var shell = {
          start: moment(new Date(2014, 11, 29, 18, 0, 0)),
          end: moment(new Date(2014, 11, 30, 19, 0, 0)),
          allDay: true,
          title: 'allday event',
          location: 'location',
          description: 'description',
          attendees: [{
            id: '123456',
            emails: [
              'user1@open-paas.org'
            ],
            displayName: 'User One'
          }, {
            id: '654321',
            emails: [
              'user2@open-paas.org'
           ],
            displayName: 'user2@open-paas.org'
          }],
          organizer: {
            emails: [
              'organizer@open-paas.org'
            ],
            displayName: 'organizer@open-paas.org'
          }
        };
        var ical = [
          'vcalendar',
          [],
          [
            [
              'vevent',
              [
                [
                  'uid',
                  {},
                  'text',
                  '00000000-0000-4000-a000-000000000000'
               ],
                [
                  'summary',
                  {},
                  'text',
                  'allday event'
               ],
                [
                'organizer',
                {
                  'cn': 'organizer@open-paas.org'
                },
                'cal-address',
                'mailto:organizer@open-paas.org'
               ],
                [
                  'dtstart',
                  {
                    'tzid': 'Europe\/Paris'
                  },
                  'date',
                  '2014-12-29'
               ],
                [
                  'dtend',
                  {
                    'tzid': 'Europe\/Paris'
                  },
                  'date',
                  '2014-12-30'
               ],
                [
                  'transp',
                  {},
                  'text',
                  'TRANSPARENT'
               ],
                [
                  'location',
                  {},
                  'text',
                  'location'
               ],
                [
                  'description',
                  {},
                  'text',
                  'description'
               ],
                [
                  'attendee',
                  {
                    'x-rse-id': '123456',
                    'partstat': 'NEEDS-ACTION',
                    'rsvp': 'TRUE',
                    'role': 'REQ-PARTICIPANT',
                    'cn': 'User One'
                  },
                  'cal-address',
                  'mailto:user1@open-paas.org'
               ],
                [
                  'attendee',
                  {
                    'x-rse-id': '654321',
                    'partstat': 'NEEDS-ACTION',
                    'rsvp': 'TRUE',
                    'role': 'REQ-PARTICIPANT'
                  },
                  'cal-address',
                  'mailto:user2@open-paas.org'
               ]
             ],
            []
           ]
         ]
       ];
        var vcalendar = this.calendarService.shellToICAL(shell);
        expect(vcalendar.toJSON()).to.deep.equal(ical);
      });

      it('should correctly create a non-allday event', function() {
        var shell = {
          start: moment(new Date(2014, 11, 29, 18, 0, 0)),
          end: moment(new Date(2014, 11, 29, 19, 0, 0)),
          allDay: false,
          title: 'non-allday event'
        };
        var ical = [
          'vcalendar',
          [],
          [
            [
              'vevent',
              [
                [
                  'uid',
                  {},
                  'text',
                  '00000000-0000-4000-a000-000000000000'
               ],
                [
                  'summary',
                  {},
                  'text',
                  'non-allday event'
               ],
                [
                  'dtstart',
                  {
                    'tzid': 'Europe\/Paris'
                  },
                  'date-time',
                  '2014-12-29T18:00:00'
               ],
                [
                  'dtend',
                  {
                    'tzid': 'Europe\/Paris'
                  },
                  'date-time',
                  '2014-12-29T19:00:00'
               ],
                [
                  'transp',
                  {},
                  'text',
                  'OPAQUE'
               ]
             ],
              []
           ]
         ]
       ];

        var vcalendar = this.calendarService.shellToICAL(shell);
        expect(vcalendar.toJSON()).to.deep.equal(ical);
      });
    });
  });
});
