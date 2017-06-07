'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The event-form module controllers', function() {
  var calendarTest, eventTest, canModifyEventResult, Cache;

  beforeEach(function() {
    eventTest = {};
    var self = this;

    canModifyEventResult = true;

    var calendarUtilsMock = {
      getNewStartDate: function() {
        return self.moment('2013-02-08 09:30');
      },
      getNewEndDate: function() {
        return self.moment('2013-02-08 10:30');
      }
    };

    calendarTest = {
      href: 'href',
      id: 'id',
      color: 'color',
      selected: true,
      readOnly: true,
      isShared: sinon.stub().returns(false),
      rights: {
        getOwnerId: sinon.stub().returns('ownerId')
      },
      isSubscription: function() { return false; },
      isWritable: angular.noop
    };

    this.calendars = [
      calendarTest,
      {
        href: 'href2',
        id: 'id2',
        color: 'color2',
        isWritable: angular.noop,
        isShared: sinon.stub().returns(false),
        isSubscription: function() { return false; }
      }, {
        href: 'href3',
        id: 'id3',
        color: 'color',
        selected: true,
        readOnly: true,
        isShared: sinon.stub().returns(false),
        rights: {
          getOwnerId: sinon.stub().returns('ownerId')
        },
        isSubscription: function() { return true; },
        isWritable: angular.noop,
        source: {
          id: 'calId',
          href: 'href4',
          color: 'color',
          selected: true,
          readOnly: true,
          isShared: sinon.stub().returns(false),
          rights: {
            getOwnerId: sinon.stub().returns('ownerId')
          },
          isSubscription: function() { return false; },
          isWritable: angular.noop
        }
      }
    ];

    this.calEventServiceMock = {
      createEvent: sinon.spy(function() {
        return $q.when({});
      }),
      changeParticipation: sinon.spy(function() {
        return $q.when({});
      }),
      modifyEvent: function(path, e) { // eslint-disable-line
        eventTest = e;

        return $q.when();
      }
    };

    this.calendarHomeId = 'calendarHomeId';

    this.calendarServiceMock = {
      calendarId: '1234',
      listCalendars: sinon.spy(function() {
        return $q.when(self.calendars);
      })
    };

    var sessionMock = {
      user: {
        firstname: 'first',
        lastname: 'last',
        emails: ['user@test.com'],
        emailMap: { 'user@test.com': true }
      },
      ready: {
        then: function() {}
      }
    };

    this.notificationFactory = {
      weakInfo: sinon.spy(),
      weakError: sinon.spy()
    };

    this.calOpenEventForm = sinon.spy();
    this.$state = {
      is: sinon.stub().returns('to be or not to be'),
      go: sinon.stub().returns('toto')
    };

    Cache = function() {};
    Cache.prototype.get = function() {
      return $q.when({
        data: {
          _id: 'ownerId',
          firstname: 'owner',
          lastname: 'owner',
          emails: ['owner@open-paas.org']
        }
      });
    };

    self.userUtilsMock = {
      displayNameOf: sinon.spy()
    };

    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.decorator('calendarUtils', function($delegate) {
        return angular.extend($delegate, calendarUtilsMock);
      });
      $provide.value('calEventService', self.calEventServiceMock);
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('session', sessionMock);
      $provide.value('Cache', Cache);
      $provide.value('notificationFactory', self.notificationFactory);
      $provide.value('calOpenEventForm', self.calOpenEventForm);
      $provide.value('$state', self.$state);
      $provide.value('userUtils', self.userUtilsMock);
      $provide.factory('calEventsProviders', function() {
        return {
          setUpSearchProviders: function() {}
        };
      });
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, moment, calEventUtils, calUIAuthorizationService, session, CalendarShell, CAL_EVENTS, CAL_ALARM_TRIGGER, CAL_EVENT_FORM) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.moment = moment;
    this.calEventUtils = calEventUtils;
    this.calUIAuthorizationService = calUIAuthorizationService;
    this.session = session;
    this.CalendarShell = CalendarShell;
    this.CAL_EVENTS = CAL_EVENTS;
    this.CAL_ALARM_TRIGGER = CAL_ALARM_TRIGGER;
    this.CAL_EVENT_FORM = CAL_EVENT_FORM;
  }));

  beforeEach(function() {
    this.calEventUtils.getNewAttendees = function() {
      return [];
    };
    sinon.stub(this.calUIAuthorizationService, 'canModifyEventRecurrence', function() {
      return true;
    });

    sinon.stub(this.calUIAuthorizationService, 'canModifyEvent', function() {
      return canModifyEventResult;
    });

    sinon.stub(this.calUIAuthorizationService, 'canModifyEventAttendees', function() {
      return true;
    });
  });

  describe('The CalEventFormController controller', function() {

    beforeEach(function() {
      this.scope.calendarHomeId = this.calendarHomeId;
      this.initController = function() {
        this.controller('CalEventFormController', {
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
        this.calEventServiceMock.createEvent = function() {
          done();
        };
        this.initController();
        this.scope.submit();
        this.scope.$digest();
      });

      it('should be modifyEvent if event has a gracePeriodTaskId property', function(done) {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          title: 'title',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          gracePeriodTaskId: '123456'
        });
        this.calEventServiceMock.modifyEvent = function() {
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
          path: '/calendars/' + this.calendars[1].id + '/eventID',
          title: 'title',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          etag: '123456'
        });

        this.calEventServiceMock.modifyEvent = function() {
          done();
        };
        this.initController();
        this.scope.editedEvent = this.scope.event.clone();
        this.scope.editedEvent.title = 'newTitle';
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
        this.userUtilsMock.displayNameOf = sinon.stub().returns('first last');
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

        expect(this.scope.calendar).to.equal(calendarTest);
      });

      it('should select the calendar of the event from calendarService.listCalendars if not new event', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          etag: 'i am not a new event'
        });
        this.scope.event.path = '/calendars/' + this.calendars[1].id + '/eventID';
        this.initController();

        expect(this.scope.calendar).to.equal(this.calendars[1]);
      });

      it('should select the calendar of the event from source if calendar is a subscription', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          etag: 'i am not a new event',
          path: '/calendars/calId/calendarId/eventId.ics'
        });
        this.scope.event.path = '/calendars/' + this.calendars[2].source.id + '/eventID';
        this.initController();

        expect(this.scope.calendar).to.equal(this.calendars[2]);
      });

      it('should call calendarService.listCalendars with options object', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});

        this.initController();

        expect(this.calendarServiceMock.listCalendars).to.be.calledWith(this.calendarHomeId);
      });

      it('should initialize calendars with calendars returned from the calendarService.listCalendars', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});

        this.initController();

        this.rootScope.$digest();

        expect(this.scope.calendars).to.deep.equal(this.calendars);
      });

      it('should initialize canModifyEvent with true if calendar.readOnly is true', function() {
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

        this.rootScope.$digest();

        expect(this.scope.canModifyEvent).to.equal(true);
      });

      it('should leverage calUIAuthorizationService.canModifyEventAttendees to set canModifyEventAttendees', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'user2@test.com'
          },
          otherProperty: 'aString'
        });

        this.initController();

        this.rootScope.$digest();

        expect(this.calUIAuthorizationService.canModifyEventAttendees).to.have.been.calledWith(this.scope.editedEvent);
      });

      it('should leverage calUIAuthorizationService.canModifyEvent to set canModifyEvent', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'user2@test.com'
          },
          otherProperty: 'aString'
        });

        this.initController();

        expect(this.calUIAuthorizationService.canModifyEvent).to.have.been.calledWith(this.scope.calendar, this.scope.editedEvent, this.session.user._id);
      });

      it('should initialize displayParticipationButton with false if calendar.readOnly is true and editedEvent.attendees.length > 1 and newAttendees.length > 0', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});

        this.initController();

        this.rootScope.$digest();

        expect(this.scope.displayParticipationButton).to.equal(false);
      });

      it('should initialize displayParticipationButton with false if calendar.readOnly is true', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          attendees: [{
            name: 'attendee1',
            email: 'attendee1@openpaas.org',
            partstart: 'ACCEPTED'
          }, {
            name: 'attendee2',
            email: 'attendee2@openpaas.org',
            partstart: 'ACCEPTED'
          }]
        });

        this.calEventUtils.getNewAttendees = function() {
          return ['user', 'user1'];
        };

        this.initController();

        this.rootScope.$digest();

        expect(this.scope.displayParticipationButton).to.equal(false);
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

      it('should initialize the class property with the default value if it is a new event', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({});

        this.initController();

        expect(this.scope.editedEvent.class).to.equal(this.CAL_EVENT_FORM.class.default);
      });
    });

    describe('modifyEvent function', function() {
      beforeEach(function() {
        this.calEventUtils.hasSignificantChange = function() {
        };
      });

      describe('as an organizer', function() {
        it('should call modifyEvent with options.notifyFullcalendar true only if the state is calendar.main', function() {
          this.scope.event = this.CalendarShell.fromIncompleteShell({title: 'title'});
          this.$state.is = sinon.stub().returns(true);
          this.calEventServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag, onCancel, options) { // eslint-disable-line
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
          this.calEventUtils.originalEvent = null;
          var $alertMock = function(alertObject) {
            expect(alertObject.show).to.be.true;
            expect(alertObject.content).to.equal('You must define an event title');
            done();
          };

          this.controller('CalEventFormController', {
            $rootScope: this.rootScope,
            $scope: this.scope,
            $alert: $alertMock
          });

          this.scope.$digest();

          this.scope.modifyEvent();
        });

        it('should not send modify request if no change', function(done) {
          this.scope.event = this.CalendarShell.fromIncompleteShell({
            start: this.moment('2013-02-08 12:30'),
            end: this.moment('2013-02-08 13:30'),
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

          this.calEventServiceMock.modifyEvent = sinon.spy(function() {
            return $q.when();
          });

          this.scope.modifyEvent();
          this.scope.$digest();

          expect(this.calEventServiceMock.modifyEvent).to.have.been.calledWith(sinon.match.any, this.scope.editedEvent);
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

          this.calEventServiceMock.modifyEvent = sinon.spy(function() {
            return $q.when();
          });

          this.scope.modifyEvent();

          this.scope.$digest();

          var calendarId = calendarTest.id;
          var expectedPath = '/calendars/' + this.calendarHomeId + '/' + calendarId;

          expect(this.$state.is).to.have.been.called;
          expect(this.calEventServiceMock.modifyEvent).to.have.been.calledWith(expectedPath, this.scope.editedEvent, this.scope.event, this.scope.etag, sinon.match.any, {
            graceperiod: true,
            notifyFullcalendar: this.$state.is()
          });
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

          expect(eventTest).to.shallowDeepEqual({
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
            path: '/calendars/' + this.calendars[1].id + '/eventID',
            etag: '123123'
          });
          this.initController();

          this.scope.editedEvent = this.CalendarShell.fromIncompleteShell({
            title: 'title',
            path: '/path/to/event',
            etag: '123123'
          });

          var self = this;

          this.calEventServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag) {
            expect(event.title).to.equal('title');
            expect(oldEvent.title).to.equal('oldtitle');
            expect(path).to.equal('/calendars/' + self.calendars[1].id + '/eventID');
            expect(etag).to.equal('123123');

            return $q.when();
          });

          this.scope.modifyEvent();

          this.scope.$digest();

          expect(this.calEventServiceMock.modifyEvent).to.have.been.called;
        });

        it('should removeAllException if rrule has been changed', function() {
          var editedEvent = this.CalendarShell.fromIncompleteShell({
            title: 'title',
            path: '/calendars/' + this.calendars[1].id + '/eventID',
            etag: '123123',
            getOrganizerPartStat: _.constant(),
            attendees: [],
            equals: _.constant(false),
            deleteAllException: sinon.spy(),
            setOrganizerPartStat: _.constant()
          });

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
          var editedEvent = this.CalendarShell.fromIncompleteShell({
            title: 'title',
            path: '/calendars/' + this.calendars[1].id + '/eventID',
            etag: '123123',
            getOrganizerPartStat: _.constant(),
            attendees: [],
            equals: _.constant(true),
            deleteAllException: sinon.spy(),
            setOrganizerPartStat: _.constant()
          });

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
          canModifyEventResult = false;
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

          this.calEventServiceMock.changeParticipation = function(path, event, emails, _status_) { // eslint-disable-line
            status = _status_;

            return $q.when({});
          };
          this.initController();

          this.scope.userAsAttendee = {
            partstat: 'ACCEPTED'
          };
          this.scope.modifyEvent();
          this.scope.$digest();
        });

        it('should no displayNotification if response is null', function(done) {
          var status = null;
          var self = this;

          this.scope.event = this.CalendarShell.fromIncompleteShell({});
          this.calEventServiceMock.changeParticipation = function(path, event, emails, _status_) { // eslint-disable-line
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

    describe('changeParticipation function', function() {
      beforeEach(function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'user@test.com'
          },
          otherProperty: 'aString'
        });
        canModifyEventResult = false;
        this.$state.go = sinon.spy();
        this.scope.$hide = sinon.spy();
        this.initController();
        this.scope.isOrganizer = false;
      });

      it('should update the event', function() {
        var status;

        this.calEventServiceMock.changeParticipation = function(path, event, emails, _status_) { // eslint-disable-line
          status = _status_;

          return $q.when({});
        };

        this.scope.changeParticipation('ACCEPTED');
        this.scope.$digest();

        expect(status).to.equal('ACCEPTED');
      });

      it('should call calEventService.changeParticipation', function() {
        this.scope.changeParticipation('ACCEPTED');

        expect(this.calEventServiceMock.changeParticipation).to.have.been.called;
      });

      it('should go to the calendar view if user is attendee and view is full form', function() {
        this.$state.is = function(state) {
          return state === 'calendar.event.form';
        };
        this.scope.changeParticipation('ACCEPTED');
        this.scope.$digest();

        expect(this.$state.go).to.have.been.calledWith('calendar.main');
      });

      it('should go to the calendar view if user is attendee and view is consult form', function() {
        this.$state.is = function(state) {
          return state === 'calendar.event.consult';
        };
        this.scope.changeParticipation('ACCEPTED');
        this.scope.$digest();

        expect(this.$state.go).to.have.been.calledWith('calendar.main');
      });

      it('should hide the modal if user is attendee and view is quick form', function() {
        this.$state.is = sinon.stub().returns(false);
        this.scope.changeParticipation('ACCEPTED');
        this.scope.$digest();

        expect(this.scope.$hide).to.have.been.called;
      });

    });

    describe('createEvent function', function() {
      beforeEach(function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'user@test.com'
          },
          otherProperty: 'aString'
        });
        this.userUtilsMock.displayNameOf = sinon.stub().returns('first last');
        this.initController();
      });

      it('should call createEvent with options.notifyFullcalendar true only if the state is calendar.main', function() {
        this.$state.is = sinon.stub().returns(true);
        this.calEventServiceMock.createEvent = sinon.spy(function(calendarId, path, event, options) { // eslint-disable-line
          expect(options).to.deep.equal({
            graceperiod: true,
            notifyFullcalendar: true
          });

          return $q.when();
        });

        this.scope.createEvent();
        this.scope.$digest();

        expect(this.$state.is).to.have.been.calledWith('calendar.main');
      });

      it('should force title to \'No title\' if the edited event has no title', function() {
        this.scope.createEvent();

        expect(this.scope.editedEvent.title).to.equal('No title');
      });

      it('should initialize the class with \'public\' if the edited event has no class', function() {
        this.scope.createEvent();

        expect(this.scope.editedEvent.class).to.equal('PUBLIC');
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

      it('should return error notification when calendar is undefined', function() {
        this.scope.calendar = null;

        this.scope.createEvent();

        expect(this.notificationFactory.weakError).to.have.been.calledWith('Event creation failed', 'Cannot join the server, please try later');
      });

      it('should call calOpenEventForm on cancelled task', function() {
        this.calEventServiceMock.createEvent = function() {
          return $q.when(false);
        };

        this.scope.createEvent();
        this.scope.$digest();

        expect(this.calOpenEventForm).to.have.been.called;
      });

      it('should call calEventService.createEvent with the correct parameters', function() {
        this.scope.createEvent();
        var calendarId = calendarTest.id;
        var expectedPath = '/calendars/' + this.calendarHomeId + '/' + calendarId;

        this.scope.$digest();

        expect(this.$state.is).to.have.been.called;
        expect(this.calEventServiceMock.createEvent).to.have.been.calledWith(calendarId, expectedPath, this.scope.editedEvent, {
          graceperiod: true,
          notifyFullcalendar: this.$state.is()
        });
      });

      it('should call calEventService.createEvent with calendar owner as organizer when creating event on shared calendar', function() {
        calendarTest.isShared = sinon.stub().returns(true);
        this.userUtilsMock.displayNameOf = sinon.stub().returns('owner owner');
        this.scope.createEvent();
        var calendarId = calendarTest.id;
        var expectedPath = '/calendars/' + this.calendarHomeId + '/' + calendarId;

        this.scope.$digest();

        expect(this.$state.is).to.have.been.called;
        expect(calendarTest.isShared).to.have.been.called;
        expect(calendarTest.rights.getOwnerId).to.have.been.calledWith;
        expect(this.scope.editedEvent.organizer).to.deep.equal({
          fullmail: 'owner owner <owner@open-paas.org>',
          email: 'owner@open-paas.org',
          name: 'owner owner',
          displayName: 'owner owner'
        });
        expect(this.calEventServiceMock.createEvent).to.have.been.calledWith(calendarId, expectedPath, this.scope.editedEvent, {
          graceperiod: true,
          notifyFullcalendar: this.$state.is()
        });
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
          start: this.moment('2013-02-08 12:30'),
          attendees: []
        });
        this.initController();
        this.scope.editedEvent.setOrganizerPartStat('DECLINED');
      });

      describe('when isOrganizer is false', function() {
        beforeEach(function() {
          this.scope.isOrganizer = false;
        });

        it('should call changeParticipation and broadcast on CAL_EVENTS.EVENT_ATTENDEES_UPDATE', function(done) {
          this.scope.$on(this.CAL_EVENTS.EVENT_ATTENDEES_UPDATE, function() {
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

        it('should modify attendees list and broadcast on CAL_EVENTS.EVENT_ATTENDEES_UPDATE', function(done) {
          this.scope.$on(this.CAL_EVENTS.EVENT_ATTENDEES_UPDATE, function(event, attendees) { // eslint-disable-line
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

          this.scope.$on(this.CAL_EVENTS.EVENT_ATTENDEES_UPDATE, broadcastSpy);

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
      beforeEach(function() {
        canModifyEventResult = false;
      });

      it('should do nothing if the alarm has not changed', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          title: 'title',
          start: this.moment('2016-12-08 12:30'),
          end: this.moment('2016-12-08 13:30'),
          location: 'aLocation',
          etag: '123456',
          alarm: {
            trigger: this.CAL_ALARM_TRIGGER[1].value,
            attendee: 'test@open-paas.org'
          }
        });
        this.initController();
        this.calEventServiceMock.modifyEvent = sinon.spy(function() {
          return $q.when();
        });

        this.scope.editedEvent = this.scope.event.clone();
        this.scope.updateAlarm();

        expect(this.calEventServiceMock.modifyEvent).to.have.not.been.called;
      });

      it('should call calEventService.modifyEvent with updateAlarm when alarm is changed', function() {
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

        this.calEventServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag, onCancel) { // eslint-disable-line
          expect(path).to.equal('/path/to/event');
          expect(etag).to.equal('123456');
          expect(event.alarm.trigger.toICALString()).to.equal('-P2D');
          expect(oldEvent.alarm.trigger.toICALString()).to.equal('-PT1M');

          return $q.when();
        });

        this.scope.updateAlarm();

        expect(this.calEventServiceMock.modifyEvent).to.have.been.called;
      });
    });

    describe('displayCalMailToAttendeesButton function', function() {
      beforeEach(function() {
        canModifyEventResult = false;
      });

      it('should return true if the event has attendees and it is not in the grace periode and it is an old event', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          attendees: [{
            name: 'organiser',
            email: 'organiser@openpaas.org',
            partstart: 'ACCEPTED'
          },
            {
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstart: 'ACCEPTED'
            }],
          etag: '0000'
        });

        this.initController();

        expect(this.scope.displayCalMailToAttendeesButton()).to.be.true;
      });

      it('should return false if the event has no attendees', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          gracePeriodTaskId: '0000'
        });

        this.initController();

        expect(this.scope.displayCalMailToAttendeesButton()).to.be.false;
      });

      it('should return false if the event is in the grace periode', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          attendees: [{
            name: 'organiser',
            email: 'organiser@openpaas.org',
            partstart: 'ACCEPTED'
          },
            {
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstart: 'ACCEPTED'
            }],
          gracePeriodTaskId: '0000',
          etag: '0000'
        });

        this.initController();

        expect(this.scope.displayCalMailToAttendeesButton()).to.be.false;
      });

      it('should return false if the event is a new event(not yet in the calendar)', function() {
        this.scope.event = this.CalendarShell.fromIncompleteShell({
          attendees: [{
            name: 'organiser',
            email: 'organiser@openpaas.org',
            partstart: 'ACCEPTED'
          },
            {
              name: 'attendee1',
              email: 'attendee1@openpaas.org',
              partstart: 'ACCEPTED'
            }],
          gracePeriodTaskId: '0000'
        });

        this.initController();

        expect(this.scope.displayCalMailToAttendeesButton()).to.be.false;
      });
    });
  });
});
