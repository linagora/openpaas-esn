'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module', function() {

  describe('The calendarService service', function() {
    var ICAL;

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

      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
        $provide.value('jstz', self.jstz);
        $provide.value('uuid4', self.uuid4);
      });
    });

    beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, _ICAL_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.calendarService = calendarService;

      ICAL = _ICAL_;
    }));

    describe('The list fn', function() {
      it('should list events', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

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
              ['location', {}, 'text', 'location'],
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
            expect(events[0].location).to.equal('location');
            expect(events[0].start.getTime()).to.equal(new Date(2014, 0, 1, 2, 3, 4).getTime());
            expect(events[0].end.getTime()).to.equal(new Date(2014, 0, 1, 3, 3, 4).getTime());
            expect(events[0].vcalendar).to.be.an('object');
            expect(events[0].etag).to.be.empty;
            expect(events[0].path).to.be.empty;
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
              ['attendee', { 'partstat': 'ACCEPTED', 'cn': 'name' }, 'cal-address', 'mailto:test@example.com'],
              ['attendee', { 'partstat': 'DECLINED' }, 'cal-address', 'mailto:noname@example.com'],
              ['attendee', { 'partstat': 'TENTATIVE' }, 'cal-address', 'mailto:tentative@example.com']
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
            expect(event.start.getTime()).to.equal(new Date(2014, 0, 1, 2, 3, 4).getTime());
            expect(event.end.getTime()).to.equal(new Date(2014, 0, 1, 3, 3, 4).getTime());

            expect(event.formattedDate).to.equal('January 1, 2014');
            expect(event.formattedStartTime).to.equal('2');
            expect(event.formattedStartA).to.equal('am');
            expect(event.formattedEndTime).to.equal('3');
            expect(event.formattedEndA).to.equal('am');

            expect(event.attendees.ACCEPTED.length).to.equal(1);
            expect(event.attendees.ACCEPTED[0].fullmail).to.equal('name <test@example.com>');
            expect(event.attendees.ACCEPTED[0].mail).to.equal('test@example.com');
            expect(event.attendees.ACCEPTED[0].name).to.equal('name');
            expect(event.attendees.ACCEPTED[0].partstat).to.equal('ACCEPTED');

            expect(event.attendees.DECLINED.length).to.equal(1);
            expect(event.attendees.DECLINED[0].fullmail).to.equal('noname@example.com');
            expect(event.attendees.DECLINED[0].mail).to.equal('noname@example.com');
            expect(event.attendees.DECLINED[0].name).to.equal('noname@example.com');
            expect(event.attendees.DECLINED[0].partstat).to.equal('DECLINED');

            expect(event.attendees.OTHER.length).to.equal(1);
            expect(event.attendees.OTHER[0].fullmail).to.equal('tentative@example.com');
            expect(event.attendees.OTHER[0].partstat).to.equal('TENTATIVE');

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

        this.calendarService.create('/path/to/calendar', vcalendar).then(
          function(response) {
            expect(response.status).to.equal(201);
            expect(response.data).to.deep.equal(vcalendar.toJSON());
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
        vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date()));
        vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date()));
        vcalendar.addSubcomponent(vevent);
        this.vcalendar = vcalendar;

        this.$httpBackend.whenGET('/davserver/api/info').respond({ url: ''});
      });

      it('should fail if status is 201', function(done) {
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(201, this.vcalendar.toJSON());

        this.calendarService.modify('/path/to/uid.ics', this.vcalendar).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 200', function(done) {
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), { 'ETag': 'changed-etag' });

        this.calendarService.modify('/path/to/uid.ics', this.vcalendar).then(
          function(shell) {
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('changed-etag');
            expect(shell.vcalendar.toJSON()).to.deep.equal(this.vcalendar.toJSON());
            done();
          }.bind(this), unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204', function(done) {
        var headers = { 'ETag': 'changed-etag' };
        this.$httpBackend.expectPUT('/path/to/uid.ics').respond(204, '');
        this.$httpBackend.expectGET('/path/to/uid.ics').respond(200, this.vcalendar.toJSON(), headers);

        this.calendarService.modify('/path/to/uid.ics', this.vcalendar).then(
          function(shell) {
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('changed-etag');
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should send etag as If-Match header', function(done) {
        var requestHeaders = {
          'Content-Type': 'application/json+calendar',
          'Prefer': 'return-representation',
          'If-Match': 'etag',
          'ESNToken': '123',
          'Accept': 'application/json, text/plain, */*'
        };
        this.$httpBackend.expectPUT('/path/to/uid.ics', this.vcalendar.toJSON(), requestHeaders).respond(200, this.vcalendar.toJSON(), { 'ETag': 'changed-etag' });

        this.calendarService.modify('/path/to/uid.ics', this.vcalendar, 'etag').then(
          function(shell) { done(); }, unexpected.bind(null, done)
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
        vevent.addPropertyWithValue('location', 'test location');
        vevent.addPropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date()));
        vevent.addPropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date()));
        var att = vevent.addPropertyWithValue('attendee', 'mailto:test@example.com');
        att.setParameter('partstat', 'DECLINED');
        vcalendar.addSubcomponent(vevent);
        this.vcalendar = vcalendar;

        this.$httpBackend.whenGET('/davserver/api/info').respond({ url: ''});
      });

      it('should change the participation status', function(done) {

        var emails = ['test@example.com'];
        var copy = new ICAL.Component(ICAL.helpers.clone(this.vcalendar.jCal, true));
        var vevent = copy.getFirstSubcomponent('vevent');
        var att = vevent.getFirstProperty('attendee');
        att.setParameter('partstat', 'ACCEPTED');

        this.$httpBackend.expectPUT('/path/to/uid.ics', copy.toJSON()).respond(200, this.vcalendar.toJSON());

        this.calendarService.changeParticipation('/path/to/uid.ics', this.vcalendar, emails, 'ACCEPTED').then(
          function(response) { done(); }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      // Everything else is covered by the modify fn
    });

    describe('The shellToICAL fn', function() {
      function compareShell(calendarService, shell, ical) {
        var vcalendar = calendarService.shellToICAL(shell);

        var vevents = vcalendar.getAllSubcomponents();
        expect(vevents.length).to.equal(1);
        var vevent = vevents[0];

        var properties = vevent.getAllProperties();
        var propkeys = properties.map(function(p) {
          return p.name;
        }).sort();
        var icalkeys = Object.keys(ical).sort();

        var message = 'Key count mismatch in ical object.\n' +
                      'expected: ' + icalkeys + '\n' +
                      '   found: ' + propkeys;
        expect(properties.length).to.equal(icalkeys.length, message);

        for (var propName in ical) {
          var value = vevent.getFirstPropertyValue(propName).toString();
          expect(value).to.equal(ical[propName]);
        }

        return vevent;
      }

      it('should correctly create an allday event', function() {
        var shell = {
          startDate: new Date('2014-12-29T18:00:00'),
          endDate: new Date('2014-12-29T19:00:00'),
          allday: true,
          title: 'allday event',
          location: 'location',
          description: 'description'
        };
        var ical = {
          uid: '00000000-0000-4000-a000-000000000000',
          dtstart: '2014-12-29',
          dtend: '2014-12-30',
          summary: 'allday event',
          location: 'location',
          description: 'description',
          transp: 'TRANSPARENT'
        };

        compareShell(this.calendarService, shell, ical);
      });

      it('should correctly create a non-allday event', function() {
        var shell = {
          startDate: new Date(2014, 11, 29, 18, 0, 0),
          endDate: new Date(2014, 11, 29, 19, 0, 0),
          allday: false,
          title: 'non-allday event'
        };
        var ical = {
          uid: '00000000-0000-4000-a000-000000000000',
          dtstart: '2014-12-29T18:00:00',
          dtend: '2014-12-29T19:00:00',
          summary: 'non-allday event',
          transp: 'OPAQUE'
        };

        compareShell(this.calendarService, shell, ical);
        var vevent = compareShell(this.calendarService, shell, ical);
        expect(vevent.getFirstProperty('dtstart').getParameter('tzid')).to.equal('Europe/Paris');
      });
    });
  });

  describe('The userCalendarController controller', function() {

    beforeEach(function() {
      var self = this;

      this.user = {
        _id: '1'
      };

      this.uiCalendarConfig = {
        calendars: {
          userCalendar: {
            fullCalendar: function() {
            },
            offset: function() {
              return {
                top: 1
              };
            }
          }
        }
      };

      angular.mock.module('esn.calendar');
      angular.mock.module('ui.calendar', function($provide) {
        $provide.constant('uiCalendarConfig', self.uiCalendarConfig);
      });
      angular.mock.module(function($provide) {
        $provide.value('user', self.user);
        $provide.factory('calendarEventSource', function() {
          return function() {
            return [{
              title: 'RealTest',
              location: 'Paris',
              description: 'description!',
              allDay: false,
              start: new Date()
            }];
          };
        });
      });
    });

    beforeEach(angular.mock.inject(function($timeout, $window, calendarService, USER_UI_CONFIG, user, $httpBackend, $rootScope, _$compile_, _$controller_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$compile = _$compile_;
      this.calendarService = calendarService;
      this.USER_UI_CONFIG = USER_UI_CONFIG;
      this.user = user;
      this.$timeout = $timeout;
      this.$window = $window;
      this.$controller = _$controller_;
    }));

    it('The userCalendarController should be created and its scope initialized', function() {
      this.userCalendarScope = this.$rootScope.$new();
      this.userCalendarController = this.$controller('userCalendarController', {$scope: this.userCalendarScope});

      expect(this.userCalendarScope.uiConfig).to.deep.equal(this.USER_UI_CONFIG);
      expect(this.userCalendarScope.uiConfig.calendar.eventRender).to.equal(this.userCalendarScope.eventRender);
      expect(this.userCalendarScope.uiConfig.calendar.eventAfterAllRender).to.equal(this.userCalendarScope.resizeCalendarHeight);
    });

    it('The eventRender function should render the event', function() {

      this.userCalendarScope = this.$rootScope.$new();
      this.userCalendarController = this.$controller('userCalendarController', {$scope: this.userCalendarScope});

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.userCalendarScope);

      uiCalendarDiv.appendTo(document.body);
      this.userCalendarScope.$apply();
      this.$timeout.flush();

      var weekButton = uiCalendarDiv.find('.fc-agendaWeek-button');
      expect(weekButton.length).to.equal(1);
      var dayButton = uiCalendarDiv.find('.fc-agendaDay-button');
      expect(dayButton.length).to.equal(1);

      var checkRender = function() {
        var title = uiCalendarDiv.find('.fc-title');
        expect(title.length).to.equal(1);
        expect(title.hasClass('ellipsis')).to.be.true;
        expect(title.text()).to.equal('RealTest (Paris)');

        var eventLink = uiCalendarDiv.find('a');
        expect(eventLink.length).to.equal(1);
        expect(eventLink.hasClass('eventBorder')).to.be.true;
        expect(eventLink.attr('title')).to.equal('description!');
      };

      checkRender();
      weekButton.click();
      this.userCalendarScope.$apply();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }
      checkRender();
      dayButton.click();
      this.userCalendarScope.$apply();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }
      checkRender();

    });

    it('should resize the calendar height twice when the controller is created', function() {
      var called = 0;

      this.userCalendarScope = this.$rootScope.$new();
      this.userCalendarController = this.$controller('userCalendarController', {$scope: this.userCalendarScope});

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.userCalendarScope);
      this.uiCalendarConfig.calendars.userCalendar.fullCalendar = function() {
        called++;
      };

      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }
      expect(called).to.equal(2);
    });

    it('should resize the calendar height once when the window is resized', function() {
      var called = 0;

      this.userCalendarScope = this.$rootScope.$new();
      this.userCalendarController = this.$controller('userCalendarController', {$scope: this.userCalendarScope});

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.userCalendarScope);

      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }

      this.uiCalendarConfig.calendars.userCalendar.fullCalendar = function() {
        called++;
      };

      angular.element(this.$window).resize();
      expect(called).to.equal(1);
    });
  });
});
