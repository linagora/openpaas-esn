'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The event-form module controllers', function() {
  var event;

  beforeEach(function() {
    event = {};
    var self = this;

    var calendarUtilsMock = {
      getNewStartDate: function() {
        return self.moment('2013-02-08 09:30');
      },
      getNewEndDate: function() {
        return self.moment('2013-02-08 10:30');
      }
    };

    this.calendars = [{
      href: 'href',
      id: 'id',
      color: 'color',
      selected: true
    }, {
      href: 'href2',
      id: 'id2',
      color: 'color2'
    }];

    this.calendarServiceMock = {
      calendarId: '1234',
      createEvent: sinon.spy(function() {
        return $q.when({});
      }),
      listCalendars: sinon.spy(function() {
        return $q.when(self.calendars);
      }),
      modifyEvent: function(path, e) {
        event = e;
        return $q.when();
      },
      calendarHomeId: 'calendarHomeId'
    };

    var sessionMock = {
      user: {
        firstname: 'first',
        lastname: 'last',
        emails: ['user@test.com'],
        emailMap: { 'user@test.com': true }
      }
    };

    this.uiCalendarConfig = {
      calendars: {
        calendarId: {
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

    this.notificationFactory = {
      weakInfo: sinon.spy(),
      weakError: sinon.spy()
    };

    this.openEventForm = sinon.spy();
    this.$state = {
      is: sinon.stub().returns('to be or not to be')
    };

    angular.mock.module('esn.calendar');
    angular.mock.module('ui.calendar', function($provide) {
      $provide.constant('uiCalendarConfig', self.uiCalendarConfig);
    });
    angular.mock.module(function($provide) {
      $provide.decorator('calendarUtils', function($delegate) {
        return angular.extend($delegate, calendarUtilsMock);
      });
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('session', sessionMock);
      $provide.value('notificationFactory', self.notificationFactory);
      $provide.value('openEventForm', self.openEventForm);
      $provide.value('$state', self.$state);
      $provide.factory('eventsProviders', function($q) {
        return $q.when([]);
      });
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, moment, eventUtils, CALENDAR_EVENTS, CalendarShell, TRIGGER) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.moment = moment;
    this.eventUtils = eventUtils;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;
    this.CalendarShell = CalendarShell;
    this.TRIGGER = TRIGGER;
  }));

  describe('The eventFormController controller', function() {

    beforeEach(function() {
      this.initController = function() {
        this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });

        this.rootScope.$digest();
      };
    });

    describe('submit function', function() {
      it('should be createEvent if the event is new', function(done) {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation'
        });
        this.calendarServiceMock.createEvent = function() {
          done();
        };
        this.initController();
        this.scope.submit();
      });

      it('should be modifyEvent if event has a gracePeriodTaskId property', function(done) {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          title: 'title',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          gracePeriodTaskId: '123456'
        });
        this.calendarServiceMock.modifyEvent = function() {
          done();
        };
        this.initController();
        this.scope.editedEvent = this.scope.event.clone();
        this.scope.editedEvent.title = 'newTitle';
        this.scope.isOrganizer = true;
        this.scope.submit();
      });

      it('should be modifyEvent if event has a etag property', function(done) {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          title: 'title',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          etag: '123456'
        });
        this.calendarServiceMock.modifyEvent = function() {
          done();
        };
        this.initController();
        this.scope.editedEvent = this.scope.event.clone();
        this.scope.editedEvent.title = 'newTitle';
        this.scope.isOrganizer = true;
        this.scope.calendar = {
          id: 'calendarId'
        };
        this.scope.submit();
      });
    });

    describe('initFormData function', function() {
      it('should initialize the scope with $scope.editedEvent as a clone of $scope.event and add ', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          otherProperty: 'aString'
        });
        var clone = this.CalendarShell.fromIncompleteShell({_id: 'theclone'});
        this.scope.event.clone = sinon.spy(function() {
          return clone;
        });
        this.initController();
        expect(this.scope.editedEvent).to.equal(clone);
      });

      it('should initialize the organizer and add him to the attendees', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});
        this.initController();
        expect(this.scope.editedEvent.organizer).to.deep.equal({
          fullmail: 'first last <user@test.com>',
          email: 'user@test.com',
          name: 'first last',
          displayName: 'first last'
        });
        expect(this.scope.editedEvent.attendees).to.deep.equal([{
          fullmail: 'user@test.com',
          email: 'user@test.com',
          name: 'user@test.com',
          partstat: 'ACCEPTED',
          displayName: 'user@test.com'
        }]);
      });

      it('should select the selected calendar from calendarService.listCalendars if new event', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});
        this.initController();
        expect(this.scope.calendar).to.equal(this.calendars[0]);
      });

      it('should select the calendar of the event from calendarService.listCalendars if not new event', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          etag: 'i am not a new event'
        });
        this.scope.event.path = '/calendars/' + this.calendars[1].id + '/eventID';
        this.initController();
        expect(this.scope.calendar).to.equal(this.calendars[1]);
      });

      it('should detect if organizer', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'user@test.com'
          },
          otherProperty: 'aString'
        });
        this.initController();
        expect(this.scope.isOrganizer).to.equal(true);
      });

      it('should detect if not organizer', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'other@test.com'
          },
          otherProperty: 'aString'
        });
        this.initController();
        expect(this.scope.isOrganizer).to.equal(false);
      });
    });

    describe('modifyEvent function', function() {
      beforeEach(function() {
        this.eventUtils.hasSignificantChange = function() {};
      });

      describe('as an organizer', function() {
        beforeEach(function() {
          this.scope.isOrganizer = true;
        });

        it('should call modifyEvent with options.notifyFullcalendar true only if the state is calendar.main', function() {
          this.scope.event = this.CalendarShell.fromIncompleteShell({ title: 'title' });
          this.$state.is = sinon.stub().returns(true);
          this.calendarServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag, onCancel, options) {
            expect(options).to.deep.equal({
              graceperiod: true,
              notifyFullcalendar: true
            });
            return $q.when();
          });

          this.initController();

          this.scope.modifyEvent();
          expect(this.$state.is).to.have.been.calledWith('calendar.main');
        });

        it('should display an error if the edited event has no title', function(done) {
          this.scope.event = this.CalendarShell.fromIncompleteShell({});
          this.eventUtils.originalEvent = null;
          var $alertMock = function(alertObject) {
            expect(alertObject.show).to.be.true;
            expect(alertObject.content).to.equal('You must define an event title');
            done();
          };
          this.controller('eventFormController', {
            $rootScope: this.rootScope,
            $scope: this.scope,
            $alert: $alertMock
          });

          this.scope.editedEvent = {};
          this.scope.modifyEvent();
        });

        it('should not send modify request if no change', function(done) {
          this.scope.event = this.CalendarShell.fromIncompleteShell({
            start:  this.moment('2013-02-08 12:30'),
            end:  this.moment('2013-02-08 13:30'),
            title: 'title'
          });
          this.scope.$hide = done;
          this.initController();

          this.scope.editedEvent = this.scope.event;
          this.scope.modifyEvent();
        });

        it('should send modify request with an organizer if it is undefined and has attendees', function() {
          this.scope.event = this.CalendarShell.fromIncompleteShell({
            start: this.moment(),
            end: this.moment(),
            title: 'title',
            attendees: [{
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstart: 'ACCEPTED'
            }]
          });
          this.initController();

          this.scope.editedEvent = this.CalendarShell.fromIncompleteShell({
            start: this.moment(),
            end: this.moment(),
            title: 'newTitle',
            attendees: [{
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstart: 'ACCEPTED'
            }]
          });

          this.calendarServiceMock.modifyEvent = sinon.spy(function() { return $q.when(); });

          this.scope.modifyEvent();
          this.scope.$digest();

          expect(this.calendarServiceMock.modifyEvent).to.have.been.calledWith(sinon.match.any, this.scope.editedEvent);
        });

        it('should send modify request if deep changes (attendees)', function() {
          this.scope.event = this.CalendarShell.fromIncompleteShell({
            start: this.moment(),
            end: this.moment(),
            title: 'title',
            attendees: [{
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstart: 'DECLINED'
            }, {
              name: 'attendee2',
              email: 'attendee2@openpaas.org',
              partstart: 'ACCEPTED'
            }]
          });
          this.initController();

          this.scope.editedEvent = this.CalendarShell.fromIncompleteShell({
            start: this.moment(),
            end: this.moment(),
            title: 'title',
            attendees: [{
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstat: 'ACCEPTED'
            }, {
              name: 'attendee2',
              email: 'attendee2@openpaas.org',
              partstat: 'ACCEPTED'
            }]
          });

          this.calendarServiceMock.modifyEvent = sinon.spy(function() {
            return $q.when();
          });

          this.scope.modifyEvent();

          this.scope.$digest();

          var calendarId = this.calendars[0].id;
          var expectedPath = '/calendars/' + this.calendarServiceMock.calendarHomeId + '/' + calendarId;

          expect(this.$state.is).to.have.been.called;
          expect(this.calendarServiceMock.modifyEvent).to.have.been.calledWith(expectedPath, this.scope.editedEvent, this.scope.event, this.scope.etag, sinon.match.any, {graceperiod: true, notifyFullcalendar: this.$state.is()});
        });

        it('should not send modify request if properties not visible in the UI changed', function(done) {
          var editedEvent = {};
          var event = this.scope.event = this.CalendarShell.fromIncompleteShell({
            start: this.moment(),
            end: this.moment(),
            title: 'title',
            diff: 123123
          });
          this.scope.$hide = function() {
            expect(event.diff).to.equal(123123);
            expect(editedEvent.diff).to.equal(234234);
            done();
          };
          this.initController();

          editedEvent = this.scope.editedEvent = event.clone();
          this.scope.editedEvent.diff = 234234;
          this.scope.modifyEvent();
        });

        it('should add newAttendees', function() {
          this.scope.event = this.CalendarShell.fromIncompleteShell({
            title: 'oldtitle',
            path: '/path/to/event',
            attendees: [{
              name: 'attendee1',
              email: 'user1@test.com',
              partstart: 'ACCEPTED'
            }]
          });
          this.initController();

          this.scope.editedEvent = this.CalendarShell.fromIncompleteShell({
            title: 'title',
            attendees: [{
              displayName: 'attendee1',
              email: 'user1@test.com',
              partstart: 'ACCEPTED'
            }]
          });
          this.scope.newAttendees = [{
            displayName: 'attendee2',
            email: 'user2@test.com',
            partstart: 'ACCEPTED'
          }, {
            displayName: 'attendee3',
            email: 'user3@test.com',
            partstart: 'ACCEPTED'
          }];
          this.scope.modifyEvent();
          expect(event).to.shallowDeepEqual({
            title: 'title',
            attendees: [{
              displayName: 'attendee1',
              email: 'user1@test.com'
            }, {
              displayName: 'attendee2',
              email: 'user2@test.com'
            }, {
              displayName: 'attendee3',
              email: 'user3@test.com'
            }]
          });
        });

        it('should pass along the etag', function() {
          this.scope.event = this.CalendarShell.fromIncompleteShell({
            title: 'oldtitle',
            path: '/path/to/event',
            etag: '123123'
          });
          this.initController();

          this.scope.editedEvent = this.CalendarShell.fromIncompleteShell({
            title: 'title',
            path: '/path/to/event',
            etag: '123123'
          });

          this.calendarServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag) {
            expect(event.title).to.equal('title');
            expect(oldEvent.title).to.equal('oldtitle');
            expect(path).to.equal('/path/to/event');
            expect(etag).to.equal('123123');

            return $q.when();
          });

          this.scope.modifyEvent();

          this.scope.$digest();
          expect(this.calendarServiceMock.modifyEvent).to.have.been.called;
        });

        it('should removeAllException if rrule has been changed', function() {
          var editedEvent = {
            title: 'title',
            path: '/path/to/event',
            etag: '123123',
            getOrganizerPartStat: _.constant(),
            attendees: [],
            equals: _.constant(false),
            deleteAllException: sinon.spy(),
            setOrganizerPartStat: _.constant()
          };

          this.scope.event = {
            title: 'oldtitle',
            path: '/path/to/event',
            rrule: {
              equals: _.constant(false)
            },
            etag: '123123',
            clone: _.constant(editedEvent)
          };

          this.initController();

          this.scope.modifyEvent();

          expect(this.scope.editedEvent.deleteAllException).to.have.been.calledOnce;
        });

        it('should not removeAllException if rrule has not been changed', function() {
          var editedEvent = {
            title: 'title',
            path: '/path/to/event',
            etag: '123123',
            getOrganizerPartStat: _.constant(),
            attendees: [],
            equals: _.constant(true),
            deleteAllException: sinon.spy(),
            setOrganizerPartStat: _.constant()
          };

          this.scope.event = {
            title: 'oldtitle',
            path: '/path/to/event',
            rrule: {
              equals: _.constant(false)
            },
            etag: '123123',
            clone: _.constant(editedEvent)
          };

          this.initController();

          this.scope.modifyEvent();

          expect(this.scope.editedEvent.deleteAllException).to.not.have.been.called;
        });
      });

      describe('as an attendee', function() {
        beforeEach(function() {
          this.scope.isOrganizer = false;
        });

        it('should changeParticipation with ACCEPTED', function(done) {
          var status = null;
          var self = this;
          this.scope.event = this.CalendarShell.fromIncompleteShell({});

          this.scope.$hide = function() {
            expect(status).to.equal('ACCEPTED');
            expect(self.notificationFactory.weakInfo).to.have.been.called;
            done();
          };

          this.calendarServiceMock.changeParticipation = function(path, event, emails, _status_) {
            status = _status_;
            return $q.when({});
          };
          this.initController();

          this.scope.invitedAttendee = {
            partstat: 'ACCEPTED'
          };
          this.scope.isOrganizer = false;
          this.scope.modifyEvent();
          this.scope.$digest();
        });

        it('should no displayNotification if response is null', function(done) {
          var status = null;
          var self = this;
          this.scope.event = this.CalendarShell.fromIncompleteShell({});
          this.calendarServiceMock.changeParticipation = function(path, event, emails, _status_) {
            status = _status_;
            return $q.when(null);
          };
          this.scope.$hide = function() {
            expect(status).to.equal('DECLINED');
            expect(self.notificationFactory.weakInfo).to.have.not.been.called;
            done();
          };

          this.initController();

          this.scope.userAsAttendee = {
            partstat: 'DECLINED'
          };
          this.scope.isOrganizer = false;
          this.scope.modifyEvent();
          this.scope.$digest();
        });
      });
    });

    describe('createEvent function', function() {
      beforeEach(function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});
        this.initController();
      });

      it('should call createEvent with options.notifyFullcalendar true only if the state is calendar.main', function() {
        this.$state.is = sinon.stub().returns(true);
        this.calendarServiceMock.createEvent = sinon.spy(function(calendarId, path, event, options) {
          expect(options).to.deep.equal({
            graceperiod: true,
            notifyFullcalendar: true
          });
          return $q.when();
        });

        this.scope.createEvent();
        expect(this.$state.is).to.have.been.calledWith('calendar.main');
      });

      it('should force title to \'No title\' if the edited event has no title', function() {
        this.scope.createEvent();
        expect(this.scope.editedEvent.title).to.equal('No title');
      });

      it('should add newAttendees from the form', function() {
        var newAttendees = [{
          email: 'user1@test.com'
        }, {
          email: 'user2@test.com'
        }];
        this.scope.newAttendees = newAttendees;
        this.scope.createEvent();
        expect(this.scope.editedEvent).to.shallowDeepEqual({
          title: 'No title',
          attendees: [{
            email: 'user@test.com'
          }, {
            email: 'user1@test.com'
          }, {
            email: 'user2@test.com'
          }],
          organizer: {
            displayName: 'first last',
            email: 'user@test.com'
          }
        });
      });

      it('should call openEventForm on cancelled task', function() {
        this.calendarServiceMock.createEvent = function() {
          return $q.when(false);
        };

        this.scope.createEvent();
        this.scope.$digest();
        expect(this.openEventForm).to.have.been.called;
      });

      it('should call calendarService.createEvent with the correct parameters', function() {
        this.scope.createEvent();
        var calendarId = this.calendars[0].id;
        var expectedPath = '/calendars/' + this.calendarServiceMock.calendarHomeId + '/' + calendarId;
        expect(this.$state.is).to.have.been.called;
        expect(this.calendarServiceMock.createEvent).to.have.been.calledWith(calendarId, expectedPath, this.scope.editedEvent, {graceperiod: true, notifyFullcalendar: this.$state.is()});
      });
    });

    describe('canPerformCall function', function() {
      beforeEach(function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});
        this.initController();
      });

      it('should return false if scope.restActive is true', function() {
        this.scope.restActive = true;
        expect(this.scope.canPerformCall()).to.be.false;
      });

      it('should return true if restActive is false', function() {
        this.scope.restActive = false;
        expect(this.scope.canPerformCall()).to.be.true;
      });
    });

    describe('changeParticipation function', function() {
      beforeEach(function() {
        this.scope.event = this.scope.event = this.CalendarShell.fromIncompleteShell({
          start:  this.moment('2013-02-08 12:30'),
          attendees: []
        });
        this.initController();
        this.scope.editedEvent.setOrganizerPartStat('DECLINED');
      });

      describe('when isOrganizer is false', function() {
        beforeEach(function() {
          this.scope.isOrganizer = false;
        });

        it('should call changeParticipation and broadcast on CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE', function(done) {
          this.scope.$on(this.CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, function() {
            expect(this.scope.userAsAttendee).to.deep.equal({
              email: 'user@test.com',
              partstat: 'ACCEPTED'
            });
            expect(this.scope.editedEvent.changeParticipation).to.have.been.calledWith('ACCEPTED', ['user@test.com']);
            done();
          }.bind(this));

          this.scope.editedEvent.changeParticipation = sinon.spy();
          this.scope.userAsAttendee = {
            email: 'user@test.com'
          };
          this.scope.changeParticipation('ACCEPTED');
        });
      });

      describe('when isOrganizer is true', function() {
        beforeEach(function() {
          this.scope.isOrganizer = true;
        });

        it('should modify attendees list and broadcast on CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE', function(done) {
          this.scope.$on(this.CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, function(event, attendees) {
            expect(attendees).to.shallowDeepEqual([{
              email: 'user@test.com',
              partstat: 'ACCEPTED'
            }]);
            expect(this.scope.userAsAttendee).shallowDeepEqual({
              email: 'user@test.com',
              partstat: 'ACCEPTED'
            });
            done();
          }.bind(this));

          this.scope.userAsAttendee = {
            email: 'user@test.com'
          };
          this.scope.changeParticipation('ACCEPTED');
        });

        it('should not call broadcast if no change in the status', function(done) {
          var broadcastSpy = sinon.spy();
          this.scope.$on(this.CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, broadcastSpy);

          this.scope.editedEvent.changeParticipation = sinon.spy();
          this.scope.userAsAttendee = {
            email: 'user@test.com'
          };
          this.scope.changeParticipation('DECLINED');
          expect(broadcastSpy).to.not.have.been.called;
          done();
        });
      });
    });

    describe('updateAlarm function', function() {
      it('should do nothing if the alarm has not changed', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          title: 'title',
          start: this.moment('2016-12-08 12:30'),
          end: this.moment('2016-12-08 13:30'),
          location: 'aLocation',
          etag: '123456',
          alarm: {
            trigger: this.TRIGGER[1].value,
            attendee: 'test@open-paas.org'
          }
        });
        this.initController();
        this.calendarServiceMock.modifyEvent = sinon.spy(function() {
          return $q.when();
        });

        this.scope.editedEvent = this.scope.event.clone();
        this.scope.updateAlarm();
        expect(this.calendarServiceMock.modifyEvent).to.have.not.been.called;
      });

      it('should call calendarService.modifyEvent with updateAlarm when alarm is changed', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          title: 'title',
          path: '/path/to/event',
          start: this.moment('2016-12-08 12:30'),
          end: this.moment('2016-12-08 13:30'),
          location: 'aLocation',
          etag: '123456',
          alarm: {
            trigger: '-PT1M',
            attendee: 'test@open-paas.org'
          }
        });
        this.initController();
        this.scope.editedEvent = this.scope.event.clone();
        this.scope.editedEvent.alarm = {
          trigger: '-P2D',
          attendee: 'test@open-paas.org'
        };

        this.calendarServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag, onCancel) {
          expect(path).to.equal('/path/to/event');
          expect(etag).to.equal('123456');
          expect(event.alarm.trigger.toICALString()).to.equal('-P2D');
          expect(oldEvent.alarm.trigger.toICALString()).to.equal('-PT1M');
          return $q.when();
        });

        this.scope.updateAlarm();
        expect(this.calendarServiceMock.modifyEvent).to.have.been.called;
      });
    });
  });
});
