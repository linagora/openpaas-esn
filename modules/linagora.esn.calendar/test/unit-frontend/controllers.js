'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Calendar Angular module controllers', function() {
  var event;
  var liveNotification;

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
      shellToICAL: function(e) {
        event = e;
      },
      create: function() {
        return {
          then: function() {
            return {
              finally: function() {}
            };
          }
        };
      },
      icalToShell: function(event) {
        return event;
      },
      modify: function(path , e) {
        event = e;
        return {
          then: function() {
            return {
              finally: function() {}
            };
          }
        };
      }
    };

    var sessionMock = {
      user: {
        emails: ['user@test.com']
      }
    };

    var liveNotificationMock = function(namespace) {
      if (liveNotification) {
        return liveNotification(namespace);
      }
      return {
        on: function() {}
      };
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

    this.notificationFactory = {};

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module('ui.calendar', function($provide) {
      $provide.constant('uiCalendarConfig', self.uiCalendarConfig);
    });
    angular.mock.module(function($provide) {
      $provide.value('calendarUtils', calendarUtilsMock);
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('session', sessionMock);
      $provide.value('livenotification', liveNotificationMock);
      $provide.value('notificationFactory', self.notificationFactory);
      $provide.factory('calendarEventSource', function() {
        return function() {
          return [{
            title: 'RealTest',
            location: 'Paris',
            description: 'description!',
            allDay: false,
            start: new Date(),
            attendeesPerPartstat: {
              'NEEDS-ACTION': []
            }
          }];
        };
      });
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, $compile, $timeout, $window, USER_UI_CONFIG, moment, _$filter_) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$window = $window;
    this.$filter = _$filter_;
    this.USER_UI_CONFIG = USER_UI_CONFIG;
    this.moment = moment;
  }));

  describe('The partstat filter', function() {
    it('should filter attendess by parstat', function() {
      var attendees = [
        {
          id: 1,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 2,
          partstat: 'ACCEPTED'
        },
        {
          id: 3,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 4,
          partstat: 'ACCEPTED'
        },
        {
          id: 5,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 6,
          partstat: 'DECLINED'
        },
        {
          id: 7,
          partstat: 'DECLINED'
        }
      ];
      var declinedAttendees, acceptedAttendees, needsActionAttendees;

      declinedAttendees = this.$filter('partstat')(attendees, 'DECLINED');
      acceptedAttendees = this.$filter('partstat')(attendees, 'ACCEPTED');
      needsActionAttendees = this.$filter('partstat')(attendees, 'NEEDS-ACTION');

      expect(declinedAttendees).to.deep.equal([
        {
          id: 6,
          partstat: 'DECLINED'
        },
        {
          id: 7,
          partstat: 'DECLINED'
        }
      ]);

      expect(acceptedAttendees).to.deep.equal([
        {
          id: 2,
          partstat: 'ACCEPTED'
        },
        {
          id: 4,
          partstat: 'ACCEPTED'
        }
      ]);

      expect(needsActionAttendees).to.deep.equal([
        {
          id: 1,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 3,
          partstat: 'NEEDS-ACTION'
        },
        {
          id: 5,
          partstat: 'NEEDS-ACTION'
        }
      ]);
    });

  });
  describe('The eventFormController controller', function() {

    beforeEach(function() {
      this.eventFormController = this.controller('eventFormController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });
    });

    describe('initFormData function', function() {
      it('should initialize the scope with a default event if $scope.event does not exist', function() {
        this.eventFormController.initFormData();
        var expected = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30'),
          allDay: false,
          diff: 3600000
        };
        expect(this.scope.editedEvent).to.deep.equal(expected);
        delete expected.diff;
        expect(this.scope.event).to.deep.equal(expected);
      });

      it('should initialize the scope with $scope.event if it exists', function() {
        this.scope.event = {
          _id: '123456',
          start: this.moment('2013-02-08 12:30'),
          end: this.moment('2013-02-08 13:30'),
          allDay: false,
          otherProperty: 'aString'
        };
        this.eventFormController.initFormData();
        this.scope.event.diff = 3600000;
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
          otherProperty: 'aString'
        };
        this.eventFormController.initFormData();
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
          otherProperty: 'aString'
        };
        this.eventFormController.initFormData();
        expect(this.scope.isOrganizer).to.equal(false);
      });

    });

    describe('modifyEvent function', function() {
      it('should display an error if the edited event has no title', function(done) {
        var $alertMock = function(alertObject) {
          expect(alertObject.show).to.be.true;
          expect(alertObject.content).to.equal('You must define an event title');
          done();
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope,
          $alert: $alertMock
        });

        this.scope.editedEvent = {};
        this.eventFormController.modifyEvent();
      });

      it('should not send modify request if no change', function(done) {
        this.scope.createModal = {
          hide: function() {
            done();
          }
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });

        this.scope.event = {
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          title: 'title'
        };
        this.scope.editedEvent = this.scope.event;
        this.eventFormController.modifyEvent();
      });

      it('should add newAttendees', function() {
        this.scope.editedEvent = {
          title: 'title',
          attendees: ['user1@test.com']
        };
        this.scope.newAttendees = ['user2@test.com', 'user3@test.com'];
        this.eventFormController.modifyEvent();
        expect(event).to.deep.equal({
          title: 'title',
          attendees: ['user1@test.com', 'user2@test.com', 'user3@test.com']
        });
      });
    });

    describe('addNewEvent function', function() {
      it('should force title to \'No title\' if the edited event has no title', function() {
        this.scope.editedEvent = {};
        this.eventFormController.addNewEvent();
        expect(this.scope.editedEvent.title).to.equal('No title');
      });

      it('should add newAttendees from the form', function() {
        this.scope.editedEvent = {};
        this.scope.newAttendees = ['user1@test.com', 'user2@test.com'];
        this.eventFormController.addNewEvent();
        expect(event).to.deep.equal({
          title: 'No title',
          attendees: ['user1@test.com', 'user2@test.com'],
          organizer: {
            emails: ['user@test.com']
          }
        });
      });
    });

    describe('accept function', function() {
      it('should changeParticipation with ACCEPTED', function(done) {
        var spy = sinon.spy();
        var status = null;

        this.notificationFactory.weakInfo = spy;
        this.calendarServiceMock.changeParticipation = function(path, event, emails, _status_) {
          status = _status_;
          return $q.when({});
        };
        this.scope.createModal = {
          hide: function() {
            expect(status).to.deep.equal('ACCEPTED');
            expect(spy).to.have.been.called;
            done();
          }
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
        this.eventFormController.accept();
        this.scope.$digest();
      });

      it('should no displayNotification if response is null', function(done) {
        var spy = sinon.spy();

        this.notificationFactory.weakInfo = spy;
        this.calendarServiceMock.changeParticipation = function(path, event, emails, status) {
          return $q.when(null);
        };
        this.scope.createModal = {
          hide: function() {
            expect(spy).to.have.not.been.called;
            done();
          }
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
        this.eventFormController.accept();
        this.scope.$digest();
      });
    });

    describe('decline function', function() {
      it('should changeParticipation with DECLINED', function(done) {
        var spy = sinon.spy();
        var status = null;

        this.notificationFactory.weakInfo = spy;
        this.calendarServiceMock.changeParticipation = function(path, event, emails, _status_) {
          status = _status_;
          return $q.when({});
        };
        this.scope.createModal = {
          hide: function() {
            expect(status).to.deep.equal('DECLINED');
            expect(spy).to.have.been.called;
            done();
          }
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
        this.eventFormController.decline();
        this.scope.$digest();
      });
    });

    describe('maybe function', function() {
      it('should changeParticipation with TENTATIVE', function(done) {
        var spy = sinon.spy();
        var status = null;

        this.notificationFactory.weakInfo = spy;
        this.calendarServiceMock.changeParticipation = function(path, event, emails, _status_) {
          status = _status_;
          return $q.when({});
        };
        this.scope.createModal = {
          hide: function() {
            expect(status).to.deep.equal('TENTATIVE');
            expect(spy).to.have.been.called;
            done();
          }
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
        this.eventFormController.maybe();
        this.scope.$digest();
      });
    });

  });

  describe('The calendarController controller', function() {

    beforeEach(function() {
      this.scope.uiConfig = this.USER_UI_CONFIG;
      this.scope.calendarId = 'calendarId';
    });

    it('should be created and its scope initialized', function() {
      this.controller('calendarController', {$scope: this.scope});
      expect(this.scope.uiConfig.calendar.eventRender).to.equal(this.scope.eventRender);
      expect(this.scope.uiConfig.calendar.eventAfterAllRender).to.equal(this.scope.resizeCalendarHeight);
    });

    it('The eventRender function should render the event', function() {
      this.controller('calendarController', {$scope: this.scope});
      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);

      uiCalendarDiv.appendTo(document.body);
      this.scope.$apply();
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
        expect(eventLink.hasClass('event-common')).to.be.true;
        expect(eventLink.attr('title')).to.equal('description!');
      };

      checkRender();
      weekButton.click();
      this.scope.$apply();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }
      checkRender();
      dayButton.click();
      this.scope.$apply();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }
      checkRender();
      uiCalendarDiv.remove();
    });

    it('should resize the calendar height twice when the controller is created', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function() {
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
      uiCalendarDiv.remove();
    });

    it('should resize the calendar height once when the window is resized', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function() {
        called++;
      };

      angular.element(this.$window).resize();
      expect(called).to.equal(1);
      uiCalendarDiv.remove();
    });

    it('should display an error if calendar events cannot be retrieved', function(done) {

      var calendarEventSourceMock = function(calendarId, errorCallback) {
        errorCallback(new Error(), 'Can not get calendar events');
      };

      var $alertMock = function(alertObject) {
        expect(alertObject.show).to.be.true;
        expect(alertObject.content).to.equal('Can not get calendar events');
        done();
      };

      this.controller('calendarController', {
        $scope: this.scope,
        $alert: $alertMock,
        calendarEventSource: calendarEventSourceMock
      });

    });

    it('should initialize a listener on event:created ws event', function(done) {
      liveNotification = function(namespace) {
        expect(namespace).to.equal('/calendars');
        return {
          on: function(event, handler) {
            expect(event).to.equal('event:created');
            expect(handler).to.be.a('function');
            done();
          }
        };
      };

      this.scope.uiConfig = {
        calendar: {}
      };

      this.controller('calendarController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });
    });

    describe.skip('the ws event listener', function() {

      var wsEventCreateListener, wsEventModifyListener, wsEventDeleteListener;

      beforeEach(function() {
        liveNotification = function(namespace) {
          expect(namespace).to.equal('/calendars');
          return {
            on: function(event, handler) {
              switch (event) {
                case 'event:created':
                  wsEventCreateListener = handler;
                  break;
                case 'event:updated':
                  wsEventModifyListener = handler;
                  break;
                case 'event:deleted':
                  wsEventDeleteListener = handler;
                  break;
              }
            }
          };
        };

        this.scope.uiConfig = {
          calendar: {}
        };

        this.controller('calendarController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });
      });

      it('should add the event when event created', function(done) {
        var event = {id: 'anId'};

        this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event, data) {
          expect(event).to.equal('renderEvent');
          expect(data.id).to.equal('anId');
          done();
        };
        wsEventCreateListener(event);
      });

      it('should add the event when modified event', function(done) {
        var newEvent = {id: 'anId'};
        var called = 0;

        this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event, data) {
          called++;
          if (called === 1) {
            expect(event).to.equal('clientEvents');
            expect(data).to.equal('anId');
            return [{
              _allDay: '_allDay',
              _end: '_end',
              _id: '_id',
              _start: '_start'
            }];
          } else {
            expect(event).to.equal('updateEvent');
            expect(newEvent).to.deep.equal({
              id: 'anId',
              _allDay: '_allDay',
              _end: '_end',
              _id: '_id',
              _start: '_start'
            });
            done();
          }
        };

        wsEventModifyListener(newEvent);
      });

      it('should remove the event when receiving event:deleted', function(done) {
        var event = {id: 'anId'};

        this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(wsevent, data) {
          expect(wsevent).to.equal('removeEvents');
          expect(data).to.equal(event.id);
          done();
        };
        wsEventDeleteListener(event);
      });
    });
  });
});
