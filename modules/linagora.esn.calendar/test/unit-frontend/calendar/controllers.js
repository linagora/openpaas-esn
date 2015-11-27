'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendar module controllers', function() {
  var event;
  var liveNotification;
  var fullCalendarSpy;
  var createCalendarSpy;

  beforeEach(function() {
    event = {};
    fullCalendarSpy = sinon.spy();
    createCalendarSpy = sinon.spy();

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
      },
      listCalendars: function() {
        return $q.when([{
          getHref: function() { return 'href'; },
          getColor: function() { return 'color'; }
        }, {
          getHref: function() { return 'href2'; },
          getColor: function() { return 'color2'; }
        }]);
      },
      createCalendar: function() {
        createCalendarSpy();
        return $q.when();
      }
    };

    var liveNotificationMock = function(namespace) {
      if (liveNotification) {
        return liveNotification(namespace);
      }
      return {
        on: function() {},
        removeListener: function() {}
      };
    };

    this.uiCalendarConfig = {
      calendars: {
        calendarId: {
          fullCalendar: fullCalendarSpy,
          offset: function() {
            return {
              top: 1
            };
          }
        }
      }
    };

    this.gracePeriodService = {};
    this.headerServiceMock = {};
    this.userMock = {};

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
      $provide.value('livenotification', liveNotificationMock);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('headerService', self.headerServiceMock);
      $provide.value('user', self.userMock);
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
      $provide.constant('MAX_CALENDAR_RESIZE_HEIGHT', 10);
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, $compile, $timeout, $window, USER_UI_CONFIG, moment, CalendarShell) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$window = $window;
    this.USER_UI_CONFIG = USER_UI_CONFIG;
    this.moment = moment;
    this.CalendarShell = CalendarShell;
  }));

  afterEach(function() {
    liveNotification = null;
  });

  describe('The userCalendarController controller', function() {
    it('should inject both header and subheader', function() {
      this.headerServiceMock.mainHeader = {
        addInjection: sinon.spy()
      };
      this.headerServiceMock.subHeader = {
        addInjection: sinon.spy()
      };
      this.controller('userCalendarController', {$scope: this.scope});
      expect(this.headerServiceMock.mainHeader.addInjection).to.have.been.calledOnce;
      expect(this.headerServiceMock.subHeader.addInjection).to.have.been.calledOnce;
    });

    it('should resetInjection on scope destroy', function() {
      this.headerServiceMock.mainHeader = {
        addInjection: function() {}
      };
      this.headerServiceMock.subHeader = {
        addInjection: function() {}
      };
      this.headerServiceMock.resetAllInjections = sinon.spy();
      this.controller('userCalendarController', {$scope: this.scope});
      this.scope.$destroy();
      expect(this.headerServiceMock.resetAllInjections).to.have.been.calledOnce;
    });

    it('should not modify constant UI_USER_CONFIG but clone it before modifying it', function() {
      this.headerServiceMock.mainHeader = {
        addInjection: function() {}
      };
      this.headerServiceMock.subHeader = {
        addInjection: function() {}
      };
      this.headerServiceMock.resetAllInjections = sinon.spy();
      this.controller('userCalendarController', {$scope: this.scope});
      expect(this.scope.uiConfig).to.be.defined;
      expect(this.scope.uiConfig).to.not.equals(this.USER_UI_CONFIG);
    });
  });

  describe('The calendarController controller', function() {

    beforeEach(function() {
      this.scope.uiConfig = this.USER_UI_CONFIG;
      this.scope.calendarHomeId = 'calendarId';
    });

    afterEach(function() {
      this.gracePeriodService.flushAllTasks = function() {};
      this.scope.$destroy();
    });

    it('should gracePeriodService.flushAllTasks $on(\'$destroy\')', function() {
      this.gracePeriodService.flushAllTasks = sinon.spy();
      this.controller('calendarController', {$scope: this.scope});
      this.scope.$destroy();
      expect(this.gracePeriodService.flushAllTasks).to.have.been.called;
    });

    it('should register gracePeriodService.flushAllTasks on(\'beforeunload\')', function() {
      this.gracePeriodService.flushAllTasks = 'aHandler';
      var event = null;
      var handler = null;
      this.$window.addEventListener = function(evt, hdlr) {
        event = evt;
        handler = hdlr;
      };
      this.controller('calendarController', {$scope: this.scope});
      expect(event).to.equal('beforeunload');
      expect(handler).to.equal('aHandler');
    });

    it('should be created and its scope initialized', function() {
      this.controller('calendarController', {$scope: this.scope});
      expect(this.scope.uiConfig.calendar.eventRender).to.equal(this.scope.eventRender);
      expect(this.scope.uiConfig.calendar.eventAfterAllRender).to.equal(this.scope.resizeCalendarHeight);
    });

    it('The list calendars and call addEventSource for each', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.$digest();
      expect(this.scope.calendars.length).to.equal(2);
      expect(this.scope.calendars[0].getHref()).to.equal('href');
      expect(this.scope.calendars[0].getColor()).to.equal('color');
      expect(this.scope.calendars[1].getHref()).to.equal('href2');
      expect(this.scope.calendars[1].getColor()).to.equal('color2');
      expect(this.scope.eventSourcesMap.href.color).to.equal('color');
      expect(this.scope.eventSourcesMap.href2.color).to.equal('color2');
      expect(this.scope.eventSourcesMap.href.events).to.be.a('Array');
      expect(this.scope.eventSourcesMap.href2.events).to.be.a('Array');
      expect(fullCalendarSpy).to.have.been.calledTwice;
    });

    it('should createCalendar on calendars-list:added', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'addEventSource') {
          return;
        }
        called++;
      };
      this.rootScope.$broadcast('calendars-list:added', [{
        getHref: function() { return 'href'; },
        getColor: function() { return 'color'; }
      }, {
        getHref: function() { return 'href2'; },
        getColor: function() { return 'color2'; }
      }]);
      this.scope.$digest();

      // 2 are already added at initialization of the controller.
      expect(called).to.equal(4);
      expect(createCalendarSpy).to.have.been.calledTwice;
    });

    it('should emit addEventSource on calendars-list:toggleView and calendar.toggled is true', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'addEventSource') {
          return;
        }
        called++;
      };
      this.rootScope.$broadcast('calendars-list:toggleView', {toggled: true});
      this.scope.$digest();

      // 2 are already added at initialization of the controller.
      expect(called).to.equal(3);
    });

    it('should emit removeEventSource on calendars-list:toggleView and calendar.toggled is false', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'removeEventSource') {
          return;
        }
        called++;
      };
      this.rootScope.$broadcast('calendars-list:toggleView', {toggled: false});
      this.scope.$digest();

      expect(called).to.equal(1);
    });

    it('should resize the calendar height twice when the controller is created', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event === 'addEventSource') {
          return;
        }
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
      this.scope.$digest();
      var called = 0;

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        called++;
      };

      angular.element(this.$window).resize();
      expect(called).to.equal(1);
      uiCalendarDiv.remove();
    });

    it('should resize the calendar height to a max value', function() {
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

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(arg1, arg2, height) {
        expect(height).to.equal(10);
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
      this.scope.$digest();
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

    describe('the eventDropAndResize listener', function() {
      it('should call calendarService.modifyEvent with scope.event.path if it exists', function(done) {
        var event = this.CalendarShell.fromIncompleteShell({
          path: 'aPath',
          etag: 'anEtag'
        });
        this.scope.event = event;
        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag) {
          expect(path).to.equal(event.path);
          expect(oldEvent).to.be.null;
          expect(etag).to.equal(event.etag);
          done();
        };
        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(event, {});
      });

      it('should call calendarService.modifyEvent with a built path if scope.event.path does not exist', function(done) {
        var event = this.CalendarShell.fromIncompleteShell({
          etag: 'anEtag'
        });
        var calendarHomeId = 'calendarHomeId';
        this.scope.calendarHomeId = calendarHomeId;
        this.scope.event = event;
        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag) {
          expect(path).to.equal('/calendars/' + calendarHomeId + '/events');
          expect(oldEvent).to.be.null;
          expect(etag).to.equal(event.etag);
          done();
        };
        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(event, {});
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
              _start: '_start',
              start: 'start',
              end: 'end'
            }];
          } else {
            expect(event).to.equal('updateEvent');
            expect(data).to.deep.equal({
              id: 'anId',
              _allDay: '_allDay',
              _end: '_end',
              _id: '_id',
              _start: '_start',
              start: 'start',
              end: 'end'
            });
            done();
          }
        };

        wsEventModifyListener(newEvent);
      });

      it('should transform start and end date if allday is true when modified event', function(done) {
        var newEvent = {id: 'anId', allDay: true};
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
              _start: '_start',
              start: this.moment('2013-03-07T07:00:00-08:00'),
              end: this.moment('2013-03-07T07:00:00-08:00')
            }];
          } else {
            expect(event).to.equal('updateEvent');
            expect(data).to.deep.equal({
              _allDay: '_allDay',
              _end: '_end',
              _id: '_id',
              _start: '_start',
              start: '2013-03-07',
              end: '2013-03-07',
              id: 'anId',
              allDay: true
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
