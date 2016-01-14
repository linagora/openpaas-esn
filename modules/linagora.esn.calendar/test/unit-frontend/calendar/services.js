'use strict';

/* global chai: false */
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
      angular.mock.inject(function(calendarEventSource, $httpBackend, fcMoment) {
        this.$httpBackend = $httpBackend;
        this.calendarEventSource = calendarEventSource;
        this.fcMoment = fcMoment;
      });

      var data = {
        match: {start: '20140101T000000', end: '20140102T000000'}
      };
      this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond({
        _links: {self: {href: '/prepath/path/to/calendar.json'}},
        _embedded: {'dav:item': []}
      });

      var start = this.fcMoment(new Date(2014, 0, 1));
      var end = this.fcMoment(new Date(2014, 0, 2));

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
      angular.mock.inject(function(calendarEventSource, $httpBackend, fcMoment) {
        this.$httpBackend = $httpBackend;
        this.calendarEventSource = calendarEventSource;
        this.fcMoment = fcMoment;
      });

      var data = {
        match: {start: '20140101T000000', end: '20140102T000000'}
      };
      this.$httpBackend.expectPOST('/dav/api/calendars/test/events.json', data).respond({
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
                  ['status', {}, 'text', 'CANCELLED']
                ], []]
              ]
            ]
          }]
        }
      });

      var start = this.fcMoment(new Date(2014, 0, 1));
      var end = this.fcMoment(new Date(2014, 0, 2));

      var source = this.calendarEventSource('/dav/api/calendars/test/events.json');

      source(start, end, false, function(events) {
        expect(events).to.deep.equal([]);
        done();
      });
      this.$httpBackend.flush();
    });

    it('should propagate an error if calendar events cannot be retrieved', function(done) {

      var start = this.fcMoment('2015-01-01 09:00:00');
      var end = this.fcMoment('2015-01-01 09:30:00');
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

  describe('The keepChangeDuringGraceperiod service', function() {
    var self;

    beforeEach(function() {
      self = this;

      this.originalCallback = sinon.spy();
      this.events = [{id: 1, title: 'should not be replaced'}, {id:2, title: 'to be replaced'}];
      this.calId = 'a/cal/id';

      this.eventSource = function(start, end, timezone, callback) {
        callback(self.events);
      };
      this.timezone = 'who care';

      angular.mock.module('esn.calendar');

      angular.mock.module(function($provide) {
        $provide.decorator('$timeout', function($delegate) {
          self.$timeout = sinon.spy(function() {
            return $delegate.apply(self, arguments);
          });
          angular.extend(self.$timeout, $delegate);

          return self.$timeout;
        });
      });

    });

    beforeEach(angular.mock.inject(function(keepChangeDuringGraceperiod, fcMoment, _CALENDAR_GRACE_DELAY_) {
      this.keepChangeDuringGraceperiod = keepChangeDuringGraceperiod;
      this.fcMoment = fcMoment;

      this.start = this.fcMoment('1984-01-01');
      this.end = this.fcMoment('1984-01-07');
      this.CALENDAR_GRACE_DELAY = _CALENDAR_GRACE_DELAY_;
      this.modifiedEvent = {
        id: 2,
        title: 'has been replaced',
        start: this.fcMoment('1984-01-03')
      };
    }));

    describe('wrapEventSource method', function() {
      it('should not modify the original event source if no crud event', function() {

        var eventSource = sinon.spy(function(start, end, timezone, callback) {
          expect([start, end, timezone]).to.be.deep.equals([self.start, self.end, self.timezone]);
          callback(self.events);
        });

        this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledOnce;
        expect(this.originalCallback).to.have.been.calledWithExactly(this.events);
        expect(eventSource).to.have.been.calledOnce;
      });

      it('should ignore element added on other calendar', function() {
        this.modifiedEvent.id = 3;
        this.keepChangeDuringGraceperiod.registerAdd(this.modifiedEvent, 'anOtherCalendar');
        this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });

    });

    describe('deleteRegistration function', function() {
      it('should delete all registered crud', function() {
        ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
          this.keepChangeDuringGraceperiod[action](this.modifiedEvent);
          this.keepChangeDuringGraceperiod.deleteRegistration(this.modifiedEvent);
          this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
          expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
        }, this);
      });
    });

    describe('register functions', function() {

      it('should not replace event if those event has been crud since more than CALENDAR_GRACE_DELAY', function() {
        ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
          this.keepChangeDuringGraceperiod[action](this.modifiedEvent);
          expect(this.$timeout).to.have.been.calledWith(sinon.match.any, this.CALENDAR_GRACE_DELAY);
          this.$timeout.flush();
          this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
          expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
        }, this);
      });

      it('should not replace event if event that has been crud has been undo by the given callback when crud was registered', function() {
        ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
          var undo = this.keepChangeDuringGraceperiod[action](this.modifiedEvent);
          undo();
          this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
          expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
        }, this);
      });

      describe('registerUpdate function', function() {
        it('should take a event and make wrapped event sources replace event with same id from the original source by this one', function() {
          this.keepChangeDuringGraceperiod.registerUpdate(this.modifiedEvent);
          this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
          expect(this.originalCallback).to.have.been.calledWithExactly([self.events[0], self.modifiedEvent]);
        });
      });

      describe('registerDelete function', function() {
        it('should take a event and make wrapped event sources delete event with same id from the original source', function() {
          this.keepChangeDuringGraceperiod.registerDelete(this.modifiedEvent);
          this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
          expect(this.originalCallback).to.have.been.calledWithExactly([self.events[0]]);
        });
      });

      describe('registerAdd function', function() {
        it('should take a event and make wrapped event sources add this event if it is in the requested period and one the same calendar', function() {
          this.modifiedEvent.id = 3;
          this.keepChangeDuringGraceperiod.registerAdd(this.modifiedEvent, this.calId);
          this.keepChangeDuringGraceperiod.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
          expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
        });
      });

    });
  });

  describe('The calendarUtils service', function() {
    beforeEach(function() {
      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
    });

    beforeEach(angular.mock.inject(function(calendarUtils, fcMoment) {
      this.calendarUtils = calendarUtils;
      this.fcMoment = fcMoment;
    }));

    describe('the getDateOnCalendarSelect function', function() {
      it('should add 30 minutes to end if diff is 30 minutes and start is an hour', function() {
        var start = this.fcMoment('2013-02-08 09:00:00');
        var end = this.fcMoment('2013-02-08 09:30:00');
        var expectedStart = this.fcMoment('2013-02-08 09:00:00');
        var expectedEnd = this.fcMoment('2013-02-08 10:00:00');
        var date = this.calendarUtils.getDateOnCalendarSelect(start, end);
        expect(expectedStart.isSame(date.start)).to.be.true;
        expect(expectedEnd.isSame(date.end)).to.be.true;
      });

      it('should add 30 minutes to end if diff is 30 minutes and start is an half hour', function() {
        var start = this.fcMoment('2013-02-08 09:30:00');
        var end = this.fcMoment('2013-02-08 10:00:00');
        var expectedStart = this.fcMoment('2013-02-08 09:30:00');
        var expectedEnd = this.fcMoment('2013-02-08 10:30:00');
        var date = this.calendarUtils.getDateOnCalendarSelect(start, end);
        expect(expectedStart.isSame(date.start)).to.be.true;
        expect(expectedEnd.isSame(date.end)).to.be.true;
      });

      it('should return same start and end if the diff is not 30 minutes', function() {
        var start = this.fcMoment('2013-02-08 09:00:00');
        var end = this.fcMoment('2013-02-08 11:30:00');
        var expectedStart = this.fcMoment('2013-02-08 09:00:00');
        var expectedEnd = this.fcMoment('2013-02-08 11:30:00');
        var date = this.calendarUtils.getDateOnCalendarSelect(start, end);
        expect(expectedStart.isSame(date.start)).to.be.true;
        expect(expectedEnd.isSame(date.end)).to.be.true;
      });
    });
  });

  describe('The eventUtils service', function() {
    var element, fcTitle, fcContent, event, calendarService, sanitizeMock;

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

    var userEmail = 'aAttendee@open-paas.org';
    beforeEach(function() {
      var emailMap = {};
      emailMap[userEmail] = true;
      var asSession = {
        user: {
          _id: '123456',
          emails: [userEmail],
          emailMap: emailMap
        },
        domain: {
          company_name: 'test'
        }
      };
      calendarService = {};

      sanitizeMock = sinon.spy(angular.identity);

      angular.mock.module('esn.calendar');
      angular.mock.module('esn.ical');
      angular.mock.module('ngSanitize');
      angular.mock.module(function($provide) {
        $provide.value('session', asSession);
        $provide.value('calendarService', calendarService);
        $provide.value('$sanitize', sanitizeMock);
      });

      var vcalendar = {};

      vcalendar.hasOwnProperty = null; // jshint ignore:line
      event = {
        title: 'myTitle',
        description: 'description',
        location: 'location',
        vcalendar: vcalendar,
        attendees: [],
        isInstance: function() { return false; }
      };

      element = new Element();
      fcContent = new Element();
      fcTitle = new Element();
      element.innerElements['.fc-content'] = fcContent;
      element.innerElements['.fc-title'] = fcTitle;
    });

    beforeEach(angular.mock.inject(function(eventUtils, $rootScope, fcMoment) {
      this.eventUtils = eventUtils;
      this.$rootScope = $rootScope;
      this.fcMoment = fcMoment;
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

      it('should sanitize event location and event description', function() {
        this.eventUtils.render(event, element);
        expect(sanitizeMock).to.have.been.calledWith(event.description);
        expect(sanitizeMock).to.have.been.calledWith(event.location);
      });

      it('should add a title attribute if description is defined', function() {
        event.description = 'aDescription';
        this.eventUtils.render(event, element);
        expect(element.attributes.title).to.equal('aDescription');
      });

      it('should add event-needs-action class if current user is found in the DECLINED attendees', function() {
        event.attendees.push({
          email: userEmail,
          partstat: 'DECLINED'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-declined']);
      });

      it('should add event-needs-action class if current user is found in the ACCEPTED attendees', function() {
        event.attendees.push({
          email: userEmail,
          partstat: 'ACCEPTED'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-accepted']);
      });

      it('should add event-needs-action class if current user is found in the NEEDS-ACTION attendees', function() {
        event.attendees.push({
          email: userEmail,
          partstat: 'NEEDS-ACTION'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-needs-action']);
      });

      it('should add event-tentative class if current user is found in the TENTATIVE attendees', function() {
        event.attendees.push({
          email: userEmail,
          partstat: 'TENTATIVE'
        });
        this.eventUtils.render(event, element);
        expect(element.class).to.deep.equal(['event-tentative']);
      });

      it('should add the event-is-instance class for instances', function() {
        event.isInstance = function() { return true; };
        this.eventUtils.render(event, element);
        expect(element.class).to.include('event-is-instance');
      });

      it('should keep startEditable and durationEditable to undefined if the user is not an attendee of the event', function() {
        this.eventUtils.render(event, element);
        expect(event.startEditable).to.not.exist;
        expect(event.durationEditable).to.not.exist;
      });

      it('should set startEditable and durationEditable to false if the user is an attendee of the event', function() {
        event.attendees.push({
          email: userEmail
        });
        this.eventUtils.render(event, element);
        expect(event.startEditable).to.be.false;
        expect(event.durationEditable).to.be.false;
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
          start: this.fcMoment('2015-01-01 09:00:00'),
          end: this.fcMoment('2015-01-01 10:00:00')
        };
        var oldEvent = {
          start: this.fcMoment('2015-01-01 08:00:00'),
          end: this.fcMoment('2015-01-01 10:00:00')
        };
        expect(this.eventUtils.isMajorModification(newEvent, oldEvent)).to.be.true;
      });

      it('should return true when the events do not have the same end date', function() {
        var newEvent = {
          start: this.fcMoment('2015-01-01 09:00:00'),
          end: this.fcMoment('2015-01-01 10:00:00')
        };
        var oldEvent = {
          start: this.fcMoment('2015-01-01 09:00:00'),
          end: this.fcMoment('2015-01-01 11:00:00')
        };
        expect(this.eventUtils.isMajorModification(newEvent, oldEvent)).to.be.true;
      });

      it('should return false when the events have the same start and end dates', function() {
        var newEvent = {
          start: this.fcMoment('2015-01-01 09:00:00'),
          end: this.fcMoment('2015-01-01 10:00:00')
        };
        var oldEvent = {
          start: this.fcMoment('2015-01-01 09:00:00'),
          end: this.fcMoment('2015-01-01 10:00:00')
        };
        expect(this.eventUtils.isMajorModification(newEvent, oldEvent)).to.be.false;
      });
    });

    describe('isNew function', function() {
      it('should return true if event.id is undefined', function() {
        expect(this.eventUtils.isNew({})).to.be.true;
      });

      it('should return false if event.etag is defined', function() {
        expect(this.eventUtils.isNew({etag: '123'})).to.be.false;
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
        var event = {id: '123', isInstance: function() { return false; }};
        this.eventUtils.setEditedEvent(event);
        this.eventUtils.getEditedEvent().then(function(e) {
          expect(e).to.deep.equal(event);
          done();
        }, done);
        this.$rootScope.$apply();
      });

      it('should return calendarService.getEvent if editedEvent var is a recurrent event', function(done) {
        var event = {etag: '123', id: '123', isInstance: function() { return true; }, path: '/calendars/event'};
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
    var ICAL, moment, emitMessage, CalendarCollectionShellMock, keepChangeDuringGraceperiodMock;

    beforeEach(function() {
      var self = this;
      this.tokenAPI = {
        _token: '123',
        getNewToken: function() {
          var token = this._token;
          return $q.when({ data: { token: token } });
        }
      };

      keepChangeDuringGraceperiodMock = {
        registerAdd: sinon.spy(),
        registerDelete: sinon.spy(),
        registerUpdate: sinon.spy(),
        deleteRegistration: sinon.spy()
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

      this.modalCreated = false;
      this.$modal = function(options) {
        self.modalCreated = true;
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
        $provide.value('CalendarCollectionShell', function() {
          return CalendarCollectionShellMock.apply(this, arguments);
        });
        $provide.value('keepChangeDuringGraceperiod', keepChangeDuringGraceperiodMock);
      });
    });

    beforeEach(angular.mock.inject(function(calendarService, $httpBackend, $rootScope, _ICAL_, CalendarShell, fcMoment, _moment_, CALENDAR_EVENTS) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$rootScope.$emit = function(message) {
        emitMessage = message;
      };
      this.calendarService = calendarService;
      this.CalendarShell = CalendarShell;
      this.fcMoment = fcMoment;
      ICAL = _ICAL_;
      moment = _moment_;
      this.CALENDAR_EVENTS = CALENDAR_EVENTS;
    }));

    describe('The listCalendars fn', function() {
      it('should wrap each received dav:calendar in a CalendarCollectionShell', function(done) {

        var response = {
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

        var calendarCollection = {};
        CalendarCollectionShellMock = sinon.spy(function(davCal) {
          expect(davCal).to.deep.equal(response._embedded['dav:calendar'][0]);
          return calendarCollection;
        });

        this.$httpBackend.expectGET('/dav/api/calendars/homeId.json').respond(response);

        this.calendarService.listCalendars('homeId').then(function(calendars) {
          expect(calendars).to.have.length(1);
          expect(calendars[0]).to.equal(calendarCollection);
          expect(CalendarCollectionShellMock).to.have.been.called;
          done();
        });

        this.$httpBackend.flush();

      });
    });

    describe('The create calendar fn', function() {
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
        CalendarCollectionShellMock = sinon.spy(function(davCal) {
          expect(davCal).to.deep.equal(response);
          return calendarCollection;
        });

        this.$httpBackend.expectGET('/dav/api/calendars/homeId/id.json').respond(response);

        this.calendarService.getCalendar('homeId', 'id').then(function(calendar) {
          expect(calendar).to.equal(calendarCollection);
          expect(CalendarCollectionShellMock).to.have.been.called;
          done();
        });

        this.$httpBackend.flush();

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
        }.bind(this)).finally(done);

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
        }.bind(this)).finally(done);

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
        }.bind(this)).finally(done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The create fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      it('should fail on 500 response status', function(done) {
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(500, '');

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

        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true }).then(
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

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(200, '');

        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true }).then(
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
        var event = new this.CalendarShell(vcalendar);

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

        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true }).then(
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

        var socketEmitSpy = sinon.spy(function(event, data) {
          expect(event).to.equal(this.CALENDAR_EVENTS.WS.EVENT_CREATED);
          expect(JSON.stringify(data)).to.equal(JSON.stringify(new this.CalendarShell(vcalendar, {
            path: path,
            etag: etag
          })));
        });
        this.socketEmit = socketEmitSpy;

        var headers = { ETag: etag };
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: gracePeriodTaskId});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);
        emitMessage = null;

        var self = this;
        this.calendarService.createEvent('/path/to/calendar', calendarShell, { graceperiod: true }).then(
          function(shell) {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_MODIFICATION);
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal(etag);
            expect(shell.path).to.equal(path);
            expect(shell.vcalendar.toJSON()).to.deep.equal(vcalendar.toJSON());
            expect(socketEmitSpy).to.have.been.called;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed calling gracePeriodService.cancel and reopen the quick form modal', function(done) {
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
          var deffered = $q.defer();
          deffered.resolve({});
          return deffered.promise;
        };

        var socketEmitSpy = sinon.spy();
        this.socketEmit = socketEmitSpy;

        var headers = { ETag: 'etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);
        emitMessage = null;

        var self = this;
        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true }).then(
          function() {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_REMOVE);
            expect(socketEmitSpy).to.have.not.been.called;
            expect(successSpy).to.have.been.called;
            expect(self.modalCreated).to.be.true;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call keepChangeDuringGraceperiod.registerAdd', function(done) {
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

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), {ETag: 'etag'});

        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true }).then(
          function() {
            expect(keepChangeDuringGraceperiodMock.registerAdd).to.have.been.calledWith(event);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call keepChangeDuringGraceperiod.deleteRegistration if the creation is cancelled', function(done) {
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

        keepChangeDuringGraceperiodMock.deleteRegistration = function(_event) {
          expect(_event).to.equal(event);
          done();
        };

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), {ETag: 'etag'});

        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true });
        this.$rootScope.$apply();
        this.$httpBackend.flush();
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
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/00000000-0000-4000-a000-000000000000.ics').respond(200, vcalendar.toJSON(), headers);
        emitMessage = null;

        var self = this;
        this.calendarService.createEvent('/path/to/calendar', event, { graceperiod: true }).then(
          function() {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_ADD);
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
        var headers = { ETag: 'changed-etag' };
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
          expect(event).to.equal(this.CALENDAR_EVENTS.WS.EVENT_UPDATED);
        });
        this.socketEmit = socketEmitSpy;

        var self = this;
        this.calendarService.modifyEvent('/path/to/uid.ics', this.event, this.event, 'etag').then(
          function(shell) {
            expect(shell.title).to.equal('test event');
            expect(shell.etag).to.equal('changed-etag');
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_MODIFICATION);
            expect(shell.path).to.equal('/path/to/uid.ics');
            expect(socketEmitSpy).to.have.been.called;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
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

        this.calendarService.modifyEvent('/path/to/uid.ics', occShell, occShell, 'etag').then(
          function(shell) {
            // The returned item must be the master item, not the instance
            expect(shell.isInstance()).to.be.false;
            done();
          }, unexpected.bind(null, done)
        );

        function checkPUT(data) {
          vcalendar = new ICAL.Component(JSON.parse(data));
          expect(vcalendar.getAllSubcomponents('vevent')).to.have.length(2);
          return true;
        }

        $httpBackend.whenGET('/dav/api/path/to/uid.ics').respond(200, vcalendar, headers);
        $httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=10000', checkPUT).respond(202, {id: '123456789'});
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
        this.$httpBackend.expectPUT('/dav/api/path/to/uid.ics?graceperiod=10000', this.vcalendar.toJSON(), requestHeaders).respond(202, { id: '123456789' }, { ETag: 'changed-etag' });
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
        var headers = { ETag: 'changed-etag' };
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

        this.gracePeriodService.cancel = function() {
          var deffered = $q.defer();
          deffered.resolve({});
          return deffered.promise;
        };

        var socketEmitSpy = sinon.spy();
        this.socketEmit = socketEmitSpy;

        var headers = { ETag: 'etag' };
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), headers);
        emitMessage = null;

        var self = this;
        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, null, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_MODIFICATION);
            expect(socketEmitSpy).to.have.not.been.called;
            expect(successSpy).to.have.been.called;
            expect(response).to.be.false;
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call given cancelCallback when graceperiod is cancelled', function(done) {
        this.gracePeriodService.grace = function() {
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

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), { ETag: 'etag' });

        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, null, 'etag', true, done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call keepChangeDuringGraceperiod.registerUpdate', function(done) {

        this.gracePeriodService.grace = $q.when.bind(null, {
          cancelled: true,
          success: angular.noop
        });

        this.gracePeriodService.cancel = $q.when.bind(null, {});

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), {ETag: 'etag'});

        var event = this.event;
        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', event, null, 'etag').then(
          function() {
            expect(keepChangeDuringGraceperiodMock.registerUpdate).to.have.been.calledWith(event);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call keepChangeDuringGraceperiod.deleteRegistration if the creation is cancelled', function(done) {

        this.gracePeriodService.grace = $q.when.bind(null, {
          cancelled: true,
          success: angular.noop
        });

        this.gracePeriodService.cancel = $q.when.bind(null, {});

        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), {ETag: 'etag'});

        var event = this.event;
        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', event, null, 'etag');

        keepChangeDuringGraceperiodMock.deleteRegistration = function(_event) {
          expect(_event).to.equal(event);
          done();
        };

        this.$rootScope.$apply();
        this.$httpBackend.flush();
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
        this.$httpBackend.expectPUT('/dav/api/path/to/calendar/uid.ics?graceperiod=10000').respond(202, {id: '123456789'});
        this.$httpBackend.expectGET('/dav/api/path/to/calendar/uid.ics').respond(200, this.vcalendar.toJSON(), headers);
        emitMessage = null;

        var self = this;
        this.calendarService.modifyEvent('/path/to/calendar/uid.ics', this.event, null, 'etag').then(
          function() {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_MODIFICATION);
            expect(errorSpy).to.have.been.called;
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
          start: this.fcMoment(),
          end: this.fcMoment()
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

        var socketEmitSpy = sinon.spy();

        this.socketEmit = socketEmitSpy;

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        var self = this;
        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event).then(
          function(response) {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_REMOVE);
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
          expect(event).to.equal(this.CALENDAR_EVENTS.WS.EVENT_DELETED);
          expect(data).to.deep.equal(this.event);
        });
        this.socketEmit = socketEmitSpy;

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        var self = this;
        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_REMOVE);
            expect(socketEmitSpy).to.have.been.called;
            expect(response).to.be.true;
            done();
          }, unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call keepChangeDuringGraceperiod.registerDelete', function(done) {

        this.gracePeriodService.grace = $q.when.bind(null, {
          cancelled: true,
          success: angular.noop
        });

        this.gracePeriodService.cancel = $q.when.bind(null, {});

        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        var event = this.event;
        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function() {
            expect(keepChangeDuringGraceperiodMock.registerDelete).to.have.been.calledWith(event);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call keepChangeDuringGraceperiod.deleteRegistration if the creation is cancelled', function(done) {

        this.gracePeriodService.grace = $q.when.bind(null, {
          cancelled: true,
          success: angular.noop
        });

        this.gracePeriodService.cancel = $q.when.bind(null, {});

        var event = this.event;
        keepChangeDuringGraceperiodMock.deleteRegistration = function(_event) {
          expect(_event).to.equal(event);
          done();
        };

        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

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
        this.gracePeriodService.cancel = function(taskId) {
          var deffered = $q.defer();
          deffered.resolve({});
          return deffered.promise;
        };

        var socketEmitSpy = sinon.spy();
        this.socketEmit = socketEmitSpy;

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        var self = this;
        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_ADD);
            expect(socketEmitSpy).to.have.not.been.called;
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

        emitMessage = null;
        this.$httpBackend.expectDELETE('/dav/api/path/to/00000000-0000-4000-a000-000000000000.ics?graceperiod=10000').respond(202, {id: '123456789'});

        var self = this;
        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function() {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_REMOVE);
            expect(errorSpy).to.have.been.called;
            done();
          }
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

        var self = this;
        this.calendarService.removeEvent('/path/to/00000000-0000-4000-a000-000000000000.ics', this.event, 'etag').then(
          function(response) {
            expect(emitMessage).to.equal(self.CALENDAR_EVENTS.ITEM_REMOVE);
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

  describe('The calendarCurrentView factory', function() {

    var locationMock, fcMoment, calendarCurrentView;
    beforeEach(function() {
      locationMock = {};
      angular.mock.module('esn.calendar');

      angular.mock.module(function($provide) {
        $provide.value('$location', locationMock);
      });

      angular.mock.inject(function(_fcMoment_, _calendarCurrentView_) {
        fcMoment = _fcMoment_;
        calendarCurrentView = _calendarCurrentView_;
      });
    });

    describe('the save function', function() {

      it('should save start and name of current view in get parameter for day and weekView', function() {
        var date = '2015-12-01';

        ['agendaWeek', 'agendaDay'].forEach(function(name) {
          locationMock.search = sinon.spy(function(param) {
            expect(param).to.deep.equals({
              viewMode: name,
              start: date
            });
          });
          calendarCurrentView.save({
            start: fcMoment(date),
            name: name
          });

          expect(locationMock.search).to.have.been.calledOnce;
        });
      });

      it('should compute first day of month when saving a month view even if the day given is just before this month', function() {
        var firstDayOfMonthDate = '2015-12-01';

        locationMock.search = sinon.spy(function(param) {
          expect(param).to.deep.equals({
            viewMode: 'month',
            start: firstDayOfMonthDate
          });
        });

        calendarCurrentView.save({
          start: fcMoment('2015-11-30'),
          name: 'month'
        });

        expect(locationMock.search).to.have.been.calledOnce;
      });
    });

    describe('the get function', function() {

      it('should return valid view name from get param', function() {
        ['agendaWeek', 'agendaDay', 'month'].forEach(function(name) {
          locationMock.search = sinon.stub().returns({viewMode: name});

          var view = calendarCurrentView.get();
          expect(locationMock.search).to.have.been.calledOnce;
          expect(view.name).to.equals(name);
        });
      });

      it('should ignore invalid view name from get param', function() {
        locationMock.search = sinon.stub().returns({viewMode: 'the beatles'});

        var view = calendarCurrentView.get();
        expect(locationMock.search).to.have.been.calledOnce;
        expect(view.name).to.be.undefined;
      });

      it('should return valid date from get param', function() {
        var validDate = '1980-12-08';
        locationMock.search = sinon.stub().returns({start: validDate});

        var view = calendarCurrentView.get();
        expect(locationMock.search).to.have.been.calledOnce;
        expect(view.start.format('YYYY-MM-DD')).to.equals(validDate);
      });

      it('should ignore invalid date from get param in keep defaultDate of calendar config', function() {
        locationMock.search = sinon.stub().returns({start: '2001-11-29a'});

        var view = calendarCurrentView.get();
        expect(locationMock.search).to.have.been.calledOnce;
        expect(view.start).to.be.undefined;
      });
    });

  });
});
