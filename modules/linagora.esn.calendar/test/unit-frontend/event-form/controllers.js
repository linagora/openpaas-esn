'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-form module controllers', function() {
  var event;

  beforeEach(function() {
    event = {};

    var calendarUtilsMock = {
      getNewStartDate: function() {
        return moment('2013-02-08 09:30'); // jshint ignore:line
      },
      getNewEndDate: function() {
        return moment('2013-02-08 10:30'); // jshint ignore:line
      }
    };

    this.calendarServiceMock = {
      calendarId: '1234',
      createEvent: function() {
        return $q.when({});
      },
      modifyEvent: function(path, e) {
        event = e;
        return $q.when();
      }
    };

    this.calendarShellMock = {
      toICAL: function(e) {
        event = e;
      },

      fromIncompleteShell: function(e) {
        Object.defineProperty(e, 'allDay', {
          enumerable: true,
          get: function() {
            // Not quite accurate, but the question is if we need to mock
            // CalendarShell anyway.
            return this.start && this.start.hour !== 0;
          }
        });

        e.clone = function() {
          return angular.copy(this);
        };
        return e;
      }
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

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module('ui.calendar', function($provide) {
      $provide.constant('uiCalendarConfig', self.uiCalendarConfig);
    });
    angular.mock.module(function($provide) {
      $provide.decorator('calendarUtils', function($delegate) {
        return angular.extend($delegate, calendarUtilsMock);
      });
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('CalendarShell', self.calendarShellMock);
      $provide.value('session', sessionMock);
      $provide.value('notificationFactory', self.notificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, moment, eventUtils, CALENDAR_EVENTS) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.moment = moment;
    this.eventUtils = eventUtils;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;
  }));

  describe('The eventFormController controller', function() {

    beforeEach(function() {
      this.initController = function() {
        this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
      };
    });

    describe('the closeModal function', function() {
      it('should cache the editedEvent using eventService#setEditedEvent', function() {
        this.scope.event = null;
        this.eventUtils.originalEvent = null;
        this.eventUtils.getNewAttendees = sinon.stub().returns(['anAttendee']);
        this.eventUtils.setNewAttendees = sinon.spy();
        this.eventUtils.setEditedEvent = sinon.spy();
        this.scope.$hide = sinon.spy();
        this.initController();
        this.scope.closeModal();

        expect(this.eventUtils.setEditedEvent).to.have.been.calledWith(sinon.match.defined);
        expect(this.eventUtils.setNewAttendees).to.have.been.calledWith(['anAttendee']);
        expect(this.scope.$hide).to.have.been.called;
      });
    });

    describe('submit function', function() {
      it('should be createEvent if the event is new', function(done) {
        this.scope.event = {
          allDay: true,
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          clone: function() {
            return angular.copy(this);
          }
        };
        this.calendarServiceMock.createEvent = function() {
          done();
        };
        this.initController();
        this.scope.submit();
      });

      it('should be modifyEvent if event has a gracePeriodTaskId property', function(done) {
        this.scope.event = {
          title: 'title',
          id: '12345',
          allDay: true,
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          gracePeriodTaskId: '123456',
          clone: function() {
            return angular.copy(this);
          }
        };
        this.calendarServiceMock.modifyEvent = function() {
          done();
        };
        this.initController();
        this.scope.isOrganizer = true;
        this.scope.submit();
      });

      it('should be modifyEvent if event has a etag property', function(done) {
        this.scope.event = {
          title: 'title',
          id: '12345',
          allDay: true,
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          location: 'aLocation',
          etag: '123456',
          clone: function() {
            return angular.copy(this);
          }
        };
        this.calendarServiceMock.modifyEvent = function() {
          done();
        };
        this.initController();
        this.scope.isOrganizer = true;
        this.scope.submit();
      });
    });

    describe('initFormData function', function() {
      it('should initialize the scope with a default event if $scope.event.clone does not exist', function() {
        this.scope.event = {};
        this.eventUtils.originalEvent = null;
        this.initController();
        var expected = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30'),
          allDay: false
        };
        expect(this.scope.event).to.contain.all.keys(expected);
        expect(this.scope.editedEvent).to.contain.all.keys(expected);
      });

      it('should initialize the scope with a default event if $scope.event does not exist', function() {
        this.scope.event = null;
        this.eventUtils.originalEvent = null;
        this.initController();
        var expected = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30'),
          allDay: false
        };
        expect(this.scope.event).to.contain.all.keys(expected);
        expect(this.scope.editedEvent).to.contain.all.keys(expected);
      });

      it('should initialize the scope with $scope.event and $scope.editedEvent if $scope.selecteEvent exists', function() {
        this.scope.event = {
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          allDay: false,
          otherProperty: 'aString',
          clone: function() {
            return angular.copy(this);
          }
        };
        this.initController();
        expect(this.scope.event).to.deep.equal(this.scope.event);
        expect(this.scope.editedEvent).to.deep.equal(this.scope.event);
      });

      it('should detect if organizer', function() {
        this.scope.event = {
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          allDay: false,
          organizer: {
            email: 'user@test.com'
          },
          otherProperty: 'aString',
          clone: function() {
            return angular.copy(this);
          }
        };
        this.initController();
        expect(this.scope.isOrganizer).to.equal(true);
      });

      it('should detect if not organizer', function() {
        this.scope.event = {
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          organizer: {
            email: 'other@test.com'
          },
          otherProperty: 'aString',
          clone: function() {
            return angular.copy(this);
          }
        };
        this.initController();
        expect(this.scope.isOrganizer).to.equal(false);
      });
    });

    describe('modifyEvent function', function() {
      beforeEach(function() {
        this.eventUtils.isMajorModification = function() {};
      });

      describe('as an organizer', function() {
        beforeEach(function() {
          this.scope.isOrganizer = true;
        });
        it('should display an error if the edited event has no title', function(done) {
          this.scope.event = null;
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
          this.scope.event = {
            startDate: new Date(),
            endDate: new Date(),
            allDay: false,
            title: 'title',
            clone: function() {
              return angular.copy(this);
            }
          };
          this.scope.$hide = done;
          this.initController();

          this.scope.editedEvent = this.scope.event;
          this.scope.modifyEvent();
        });

        it('should send modify request if deep changes (attendees)', function() {
          this.scope.event = {
            startDate: new Date(),
            endDate: new Date(),
            allDay: false,
            title: 'title',
            attendees: [{
              name: 'attendee1',
              partstart: 'DECLINED'
            }, {
              name: 'attendee2',
              partstart: 'ACCEPTED'
            }],
            clone: function() {
              return angular.copy(this);
            }
          };
          this.initController();

          this.scope.editedEvent = {
            startDate: new Date(),
            endDate: new Date(),
            allDay: false,
            title: 'title',
            attendees: [{
              name: 'attendee1',
              partstart: 'ACCEPTED'
            }, {
              name: 'attendee2',
              partstart: 'ACCEPTED'
            }]
          };

          this.calendarServiceMock.modifyEvent = sinon.spy(function(path, event, oldEvent, etag) {
            return $q.when();
          });

          this.scope.modifyEvent();

          this.scope.$digest();
          expect(this.calendarServiceMock.modifyEvent).to.have.been.called;
        });

        it('should not send modify request if properties not visible in the UI changed', function(done) {
          var editedEvent = {};
          var event = this.scope.event = {
            startDate: new Date(),
            endDate: new Date(),
            allDay: false,
            title: 'title',
            diff: 123123,
            clone: function() {
              return angular.copy(this);
            }
          };
          this.scope.$hide = function() {
            expect(event.diff).to.equal(123123);
            expect(editedEvent.diff).to.equal(234234);
            done();
          };
          this.initController();

          editedEvent = this.scope.editedEvent = angular.copy(event);
          this.scope.editedEvent.diff = 234234;
          this.scope.modifyEvent();
        });

        it('should add newAttendees', function() {
          this.scope.event = {
            title: 'oldtitle',
            path: '/path/to/event',
            attendees: ['user1@test.com'],
            clone: function() {
              return angular.copy(this);
            }
          };
          this.initController();

          this.scope.editedEvent = {
            title: 'title',
            attendees: ['user1@test.com']
          };
          this.scope.newAttendees = ['user2@test.com', 'user3@test.com'];
          this.scope.modifyEvent();
          expect(event).to.deep.equal({
            title: 'title',
            attendees: ['user1@test.com', 'user2@test.com', 'user3@test.com']
          });
        });

        it('should pass along the etag', function() {
          this.scope.event = {
            title: 'oldtitle',
            path: '/path/to/event',
            etag: '123123',
            clone: function() {
              return angular.copy(this);
            }
          };
          this.initController();

          this.scope.editedEvent = {
            title: 'title',
            path: '/path/to/event',
            etag: '123123'
          };

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
      });

      describe('as an attendee', function() {
        beforeEach(function() {
          this.scope.isOrganizer = false;
        });

        it('should changeParticipation with ACCEPTED', function(done) {
          var status = null;
          var self = this;
          this.scope.event = this.eventUtils.originalEvent = null;

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
          this.scope.event = this.eventUtils.originalEvent = null;
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

          this.scope.invitedAttendee = {
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
        this.scope.event = this.eventUtils.originalEvent = null;
        this.initController();
        this.scope.editedEvent = {};
      });

      it('should force title to \'No title\' if the edited event has no title', function() {
        this.scope.createEvent();
        expect(this.scope.editedEvent.title).to.equal('No title');
      });

      it('should add newAttendees from the form', function() {
        this.scope.newAttendees = ['user1@test.com', 'user2@test.com'];
        this.scope.createEvent();
        expect(this.scope.editedEvent).to.deep.equal({
          title: 'No title',
          attendees: ['user1@test.com', 'user2@test.com'],
          organizer: {
            displayName: 'first last',
            emails: ['user@test.com']
          }
        });
      });
    });

    describe('canPerformCall function', function() {
      beforeEach(function() {
        this.scope.event = this.eventUtils.originalEvent = null;
        this.initController();
        this.scope.editedEvent = {
          id: 'eventId',
          start: new Date()
        };
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
        this.scope.event = this.eventUtils.originalEvent = null;
        this.initController();
        this.scope.editedEvent = {
          id: 'eventId',
          start: new Date(),
          organizer: {
            name: 'aOrganizer',
            partstat: 'DECLINED'
          },
          attendees: []
        };
        this.scope.isOrganizer = true;
      });

      it('should if isOrganizer, modify attendees list and set invitedAttendee and broadcast on CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE', function(done) {
        this.scope.$on(this.CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, function(event, attendees) {
          expect(attendees).to.deep.equal([{
            name: 'aOrganizer',
            partstat: 'ACCEPTED'
          }]);
          expect(this.scope.invitedAttendee).to.deep.equal({
            name: 'aOrganizer',
            partstat: 'ACCEPTED'
          });
          done();
        }.bind(this));

        this.scope.invitedAttendee = undefined;
        this.scope.changeParticipation('ACCEPTED');
      });

      it('should call changeParticipation if isOganizer and already invitedAttendee and broadcast on CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE', function(done) {
        this.scope.$on(this.CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, function() {
          expect(this.scope.invitedAttendee).to.deep.equal({
            name: 'aOrganizer',
            partstat: 'ACCEPTED'
          });
          expect(this.scope.editedEvent.changeParticipation).to.have.been.called;
          done();
        }.bind(this));

        this.scope.editedEvent.changeParticipation = sinon.spy();
        this.scope.invitedAttendee = {
          name: 'aOrganizer',
          partstat: 'DECLINED'
        };
        this.scope.changeParticipation('ACCEPTED');
      });
    });
  });
});
