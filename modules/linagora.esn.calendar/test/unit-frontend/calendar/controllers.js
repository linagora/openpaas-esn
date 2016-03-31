'use strict';

/* global chai: false */
/* global sinon: false */
/* global _: false */

var expect = chai.expect;

describe('The calendar module controllers', function() {
  var event;
  var liveNotification;
  var fullCalendarSpy;
  var createCalendarSpy;
  var self;

  beforeEach(function() {
    self = this;
    event = {};
    fullCalendarSpy = sinon.spy();
    createCalendarSpy = sinon.spy();

    var calendarUtilsMock = {
      getNewStartDate: function() {
        return self.fcMoment('2013-02-08 09:30');
      },
      getNewEndDate: function() {
        return self.fcMoment('2013-02-08 10:30');
      }
    };

    this.cachedEventSourceMock = {
      wrapEventSource: sinon.spy(function(id, eventSource) {
        return eventSource;
      }),
      resetCache: sinon.spy(),
      registerUpdate: sinon.spy(),
      registerDelete: sinon.spy()
    };

    this.CalendarShellConstMock = function(vcalendar, event) {
      this.etag = event.etag;
      this.path = event.path;
      this.end = self.fcMoment();
      this.clone = function() {
        return this;
      };
    };

    this.CalendarShellMock = function() {
      return self.CalendarShellConstMock.apply(this, arguments);
    };

    this.CalendarShellMock.from = sinon.spy(function(event, extendedProp) {
      return angular.extend({}, event, extendedProp);
    });

    this.CalendarShellMock.fromIncompleteShell = sinon.spy();

    this.calendars = [{
      href: 'href',
      id: 'id',
      color: 'color'
    }, {
      href: 'href2',
      id: 'id2',
      color: 'color2'
    }];

    this.calendarServiceMock = {
      calendarId: '1234',
      createEvent: function() {
        return $q.when({});
      },
      modifyEvent: sinon.spy(function(path, e) {
        event = e;
        return $q.when();
      }),
      listCalendars: function() {
        return $q.when(self.calendars);
      },
      createCalendar: function() {
        createCalendarSpy();
        return $q.when();
      }
    };

    this.calendarCurrentViewMock = {
      save: angular.noop,
      get: angular.identity.bind(null, {})
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
    this.userMock = {};
    this.eventUtilsMock = {
      applyReply: sinon.spy(),
      setBackgroundColor: sinon.spy(angular.identity)
    };

    this.calendarEventEmitterMock = {
      fullcalendar: {
        emitModifiedEvent: sinon.spy(),
        emitRemovedEvent: sinon.spy()
      }
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
      $provide.value('livenotification', liveNotificationMock);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('eventUtils', self.eventUtilsMock);
      $provide.value('user', self.userMock);
      $provide.value('cachedEventSource', self.cachedEventSourceMock);
      $provide.value('calendarCurrentView', self.calendarCurrentViewMock);
      $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      $provide.value('CalendarShell', self.CalendarShellMock);
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

  beforeEach(angular.mock.inject(function($controller, $rootScope, $compile, $timeout, $window, UI_CONFIG, moment, CalendarShell, fcMoment, CALENDAR_EVENTS) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$window = $window;
    this.UI_CONFIG = UI_CONFIG;
    this.moment = moment;
    this.CalendarShell = CalendarShell;
    this.fcMoment = fcMoment;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;
  }));

  afterEach(function() {
    liveNotification = null;
  });

  describe('The calendarController controller', function() {

    beforeEach(function() {
      this.scope.uiConfig = this.UI_CONFIG;
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

    it('should cachedEventSource.resetCache $on(\'$destroy\')', function() {
      this.gracePeriodService.flushAllTasks = angular.noop;
      this.cachedEventSourceMock.resetChange = sinon.spy();
      this.controller('calendarController', {$scope: this.scope});
      this.scope.$destroy();
      expect(this.cachedEventSourceMock.resetCache).to.have.been.called;
    });

    it('should be created and its scope initialized', function() {
      this.controller('calendarController', {$scope: this.scope});
      expect(this.scope.uiConfig.calendar.eventRender).to.equal(this.scope.eventRender);
      expect(this.scope.uiConfig.calendar.eventAfterAllRender).to.equal(this.scope.resizeCalendarHeight);
    });

    describe('The CALENDAR_EVENTS.ITEM_MODIFICATION listener', function() {
      var fcFn, clientEvents;

      beforeEach(function() {
        clientEvents = [{
          _allday: '_allday',
          _end: '_end',
          _id: '_id',
          _start: '_start',
          source: 'iamasource'
        }];

        fcFn = {
          clientEvents: _.constant(clientEvents),
          removeEvents: sinon.spy(),
          updateEvent: sinon.spy(),
          refetchEvents: sinon.spy(),
          renderEvent: sinon.spy()
        };

        this.controller('calendarController', {$scope: this.scope});

        this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event, data) {
          return (fcFn[event] || angular.noop)(data);
        };
      });

      it('should register a listener on CALENDAR_EVENTS.ITEM_MODIFICATION that refresh the calendar', function() {
        this.controller('calendarController', {$scope: this.scope});

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.ITEM_MODIFICATION);

        this.scope.uiConfig.calendar.viewRender({});
        this.scope.$digest();
        expect(fcFn.refetchEvents).to.have.been.calledOnce;
      });

    });

    it('should call fullCalendar next on swipeRight', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.swipeRight();
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('prev');
    });

    it('should call fullCalendar next on swipeLeft', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.swipeLeft();
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('next');
    });

    it('The list calendars and call addEventSource for each', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(this.scope.calendars.length).to.equal(2);
      expect(this.scope.calendars[0].href).to.equal('href');
      expect(this.scope.calendars[0].color).to.equal('color');
      expect(this.scope.calendars[1].href).to.equal('href2');
      expect(this.scope.calendars[1].color).to.equal('color2');
      expect(this.scope.eventSourcesMap.href.backgroundColor).to.equal('color');
      expect(this.scope.eventSourcesMap.href2.backgroundColor).to.equal('color2');
      expect(this.scope.eventSourcesMap.href.events).to.be.a('Array');
      expect(this.scope.eventSourcesMap.href2.events).to.be.a('Array');
      expect(fullCalendarSpy).to.have.been.calledTwice;
    });

    it('should have wrap each calendar with cachedEventSource.wrapEventSource', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
      expect(this.cachedEventSourceMock.wrapEventSource).to.have.been.calledTwice;
      expect(this.cachedEventSourceMock.wrapEventSource).to.have.been.calledWithExactly('id', sinon.match.array);

      expect(this.cachedEventSourceMock.wrapEventSource).to.have.been.calledWithExactly('id2', sinon.match.array);
    });

    it('should emit addEventSource on CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is false', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();

      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'addEventSource') {
          return;
        }
        called++;
      };

      this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: false, calendar:{}});
      this.scope.$digest();

      expect(called).to.equal(1);
    });

    it('should emit removeEventSource on CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is true', function() {
      this.controller('calendarController', {$scope: this.scope});
      var called = 0;

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(event) {
        if (event !== 'removeEventSource') {
          return;
        }
        called++;
      };
      this.scope.uiConfig.calendar.viewRender({});
      this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: true, calendar: {}});
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

    it('should change view on VIEW_TRANSLATION only when mobile mini calendar is hidden', function() {
      this.controller('calendarController', {$scope: this.scope});

      this.scope.uiConfig.calendar.viewRender({});

      var fcMethodMock = {
      };

      this.uiCalendarConfig.calendars.calendarId.fullCalendar = function(action) {
        (fcMethodMock[action] || angular.noop)();
      };

      ['prev', 'next'].forEach(function(action) {
        fcMethodMock[action] = sinon.spy();
        this.rootScope.$broadcast(this.CALENDAR_EVENTS.VIEW_TRANSLATION, action);

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
        this.rootScope.$broadcast(this.CALENDAR_EVENTS.VIEW_TRANSLATION, action);

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
        this.rootScope.$broadcast(this.CALENDAR_EVENTS.VIEW_TRANSLATION, action);

        this.scope.$digest();
        expect(fcMethodMock[action]).to.have.been.calleTwice;
      }, this);
    });

    it('should resize the calendar height once when the window is resized', function() {
      this.controller('calendarController', {$scope: this.scope});
      this.scope.$digest();

      var uiCalendarDiv = this.$compile(angular.element('<div ui-calendar="uiConfig.calendar" ng-model="eventSources"></div>'))(this.scope);
      uiCalendarDiv.appendTo(document.body);
      this.$timeout.flush();
      try {
        this.$timeout.flush();
      } catch (exception) {
        // Depending on the context, the 'no defered tasks' exception can occur
      }

      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();

      var fullCalendarSpy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy();

      angular.element(this.$window).resize();
      this.scope.$digest();
      expect(fullCalendarSpy).to.be.calledOnce;
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
      this.scope.uiConfig.calendar.viewRender({});
      this.scope.$digest();
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

    it('should initialize a listener on CALENDAR_EVENTS.WS.EVENT_CREATED ws event', function(done) {
      liveNotification = function(namespace) {
        expect(namespace).to.equal('/calendars');
        return {
          on: function(event, handler) {
            expect(event).to.equal(self.CALENDAR_EVENTS.WS.EVENT_CREATED);
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

    it('should restore view from calendarCurrentView during initialization', function() {
      var date = this.fcMoment('1953-03-16');
      this.calendarCurrentViewMock.get = sinon.spy(function() {
        return {
          name: 'agendaDay',
          start: date
        };
      });

      this.controller('calendarController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });

      expect(this.calendarCurrentViewMock.get).to.have.been.calledOnce;
      expect(this.scope.uiConfig.calendar.defaultView).to.equals('agendaDay');
      expect(this.scope.uiConfig.calendar.defaultDate).to.equals(date);
    });

    it('should save view with calendarCurrentView when view change', function() {
      var view = {};
      this.calendarCurrentViewMock.save = sinon.spy(function(_view) {
        expect(_view).to.equals(view);
      });

      this.controller('calendarController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });

      this.scope.uiConfig.calendar.viewRender(view);

      expect(this.calendarCurrentViewMock.save).to.have.been.calledOnce;
    });

    describe('the eventDropAndResize listener', function() {
      it('should call calendarService.modifyEvent with the correct argument', function() {
        var newEvent = {
          path: 'aPath',
          etag: 'anEtag'
        };
        var event = {
          path: 'aPath',
          etag: 'anEtag',
          end: this.fcMoment(),
          clone: function() {
            return newEvent;
          }
        };
        this.scope.event = event;
        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10));
        expect(this.calendarServiceMock.modifyEvent).to.have.been.calledWith(newEvent.path, newEvent, event, newEvent.etag);
      });

      it('should send a CALENDAR_EVENTS.REVERT_MODIFICATION with the event after calling fullcalendar revert when the drap and drop if reverted', function(done) {
        var event = {
          path: 'aPath',
          etag: 'anEtag',
          end: this.fcMoment(),
          clone: function() {
            return event;
          }
        };

        this.scope.event = event;

        var oldEvent;
        this.rootScope.$on(this.CALENDAR_EVENTS.REVERT_MODIFICATION, function(angularEvent, event) {
          expect(event).to.equal(oldEvent);
          done();
        });

        this.calendarServiceMock.modifyEvent = function(path, e, _oldEvent, etag, revertFunc) {
          oldEvent = _oldEvent;
          revertFunc();
          return $q.when({});
        };

        this.controller('calendarController', {$scope: this.scope});
        var fcRevert = sinon.spy();
        this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10), fcRevert);
        expect(this.eventUtilsMock.setBackgroundColor).to.have.been.calledWith(event, this.calendars);
        expect(fcRevert).to.have.been.calledOnce;
      });

      it('should call calendarService.modifyEvent with a built path if scope.event.path does not exist', function(done) {
        var event = {
          etag: 'anEtag',
          end: this.fcMoment(),
          clone: function() {
            return event;
          }
        };
        var calendarHomeId = 'calendarHomeId';
        this.scope.calendarHomeId = calendarHomeId;
        this.scope.event = event;

        this.calendarServiceMock.modifyEvent = function(path, e, oldEvent, etag) {
          expect(path).to.equal('/calendars/' + calendarHomeId + '/events');
          expect(etag).to.equal(event.etag);
          done();
        };
        this.controller('calendarController', {$scope: this.scope});
        this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10, 'seconds'));
      });

      it('should broadcast CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE when the view change', function(done) {
        this.controller('calendarController', {$scope: this.scope});

        var event = this.CalendarShell.fromIncompleteShell({
          etag: 'anEtag'
        });

        this.rootScope.$on(this.CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(angularEvent, _event) {
          expect(_event).to.equals(event);
          done();
        });

        this.scope.uiConfig.calendar.viewRender(event);

      });

      it('should receive CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE and change view if needed', function(done) {
        this.controller('calendarController', {$scope: this.scope});
        var date = this.fcMoment('2015-01-13');
        var first = true;
        self = this;
        var spy = this.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy(function(name, newDate) {
          if (name === 'getView') {
            if (first) {
              first = false;
              self.rootScope.$broadcast(self.CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, date);
            }
            return {
              start: self.fcMoment('2015-01-01'),
              end: self.fcMoment('2015-01-10')
            };
          }
          if (name === 'gotoDate') {
            expect(newDate.isSame(date, 'day')).to.be.true;
            expect(spy).to.be.calledTwice;
            done();
          }
        });

        this.rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, this.fcMoment('2015-01-13'));
        this.scope.uiConfig.calendar.viewRender({});
        this.scope.$digest();

      });

    });

    describe('the ws event listener', function() {

      var wsEventCreateListener, wsEventModifyListener, wsEventDeleteListener, wsEventRequestListener, wsEventReplyListener, wsEventCancelListener, testUpdateCacheAndFcEmit;

      beforeEach(function() {
        liveNotification = function(namespace) {
          expect(namespace).to.equal('/calendars');
          return {
            removeListener: sinon.spy(),
            on: function(event, handler) {
              switch (event) {
                case self.CALENDAR_EVENTS.WS.EVENT_CREATED:
                  wsEventCreateListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_UPDATED:
                  wsEventModifyListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_DELETED:
                  wsEventDeleteListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_REQUEST:
                  wsEventRequestListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_REPLY:
                  wsEventReplyListener = handler;
                  break;
                case self.CALENDAR_EVENTS.WS.EVENT_CANCEL:
                  wsEventCancelListener = handler;
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

        testUpdateCacheAndFcEmit = function(wsCallback, expectedCacheMethod, expectedEmitMethod) {
          var event = {id: 'id', calendarId: 'calId'};
          var path = 'path';
          var etag = 'etag';
          var resultingEvent = self.CalendarShellMock.from(event, {etag: etag, path: path});
          fullCalendarSpy = self.uiCalendarConfig.calendars.calendarId.fullCalendar = sinon.spy();

          self.scope.uiConfig.calendar.viewRender({});
          wsCallback({event: event, eventPath: path, etag: etag});
          self.scope.$digest();
          expect(self.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
          expect(self.calendarEventEmitterMock.fullcalendar[expectedEmitMethod]).to.have.been.calledWith(resultingEvent);
          expect(self.cachedEventSourceMock[expectedCacheMethod]).to.have.been.calledWith(resultingEvent);
        };
      });

      it('should update event on cache and emit a fullCalendar event for a modification on EVENT_CREATED', function() {
        testUpdateCacheAndFcEmit(wsEventCreateListener, 'registerUpdate', 'emitModifiedEvent');
      });

      it('should update event on cache and broadcast emit a fullCalendar event for a modification on EVENT_REQUEST', function() {
        testUpdateCacheAndFcEmit(wsEventRequestListener, 'registerUpdate', 'emitModifiedEvent');
      });

      it('should update event on cache and broadcast emit a fullCalendar event for a modification on EVENT_UPDATED', function() {
        testUpdateCacheAndFcEmit(wsEventModifyListener, 'registerUpdate', 'emitModifiedEvent');
      });

      it('should update event on cache and broadcast emit a fullCalendar event for a modification on EVENT_REPLY', function() {
        testUpdateCacheAndFcEmit(wsEventReplyListener, 'registerUpdate', 'emitModifiedEvent');
      });

      it('should remove event on cache and broadcast emit a fullCalendar event for a deletion on EVENT_DELETED', function() {
        testUpdateCacheAndFcEmit(wsEventDeleteListener, 'registerDelete', 'emitRemovedEvent');
      });

      it('should remove event on cache and broadcast emit a fullClaendar event for a deletion on EVENT_CANCEL', function() {
        testUpdateCacheAndFcEmit(wsEventCancelListener, 'registerDelete', 'emitRemovedEvent');
      });
    });
  });
});
