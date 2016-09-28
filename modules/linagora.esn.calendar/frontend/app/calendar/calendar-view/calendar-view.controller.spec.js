'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarViewController', function() {
  var event; // eslint-disable-line
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
      wrapEventSource: sinon.spy(function(id, eventSource) { // eslint-disable-line
        return eventSource;
      }),
      resetCache: sinon.spy(),
      registerUpdate: sinon.spy(),
      registerDelete: sinon.spy()
    };

    this.masterEventCacheMock = {
      save: sinon.spy(),
      remove: sinon.spy()
    };

    this.CalendarShellConstMock = function(vcalendar, event) { // eslint-disable-line
      this.etag = event.etag;
      this.path = event.path;
      this.end = self.fcMoment();
      this.clone = function() {
        return this;
      };
    };

    this.calendarVisibilityServiceMock = {
      isHidden: sinon.stub().returns(false)
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

    this.eventServiceMock = {
      createEvent: function() {
        return $q.when({});
      },
      modifyEvent: sinon.spy(function(path, e) { // eslint-disable-line
        event = e;

        return $q.when();
      })
    };

    this.calendarServiceMock = {
      calendarId: '1234',
      listCalendars: function() {
        return $q.when(self.calendars);
      },
      createCalendar: function() {
        createCalendarSpy();

        return $q.when();
      }
    };

    this.calendarCurrentViewMock = {
      set: angular.noop,
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

    this.calendar = {
      fullCalendar: fullCalendarSpy,
      offset: function() {
        return {
          top: 1
        };
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

    this.usSpinnerServiceMock = {
      spin: sinon.spy(),
      stop: sinon.spy()
    };

    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.decorator('calendarUtils', function($delegate) {
        return angular.extend($delegate, calendarUtilsMock);
      });
      $provide.value('eventService', self.eventServiceMock);
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('livenotification', liveNotificationMock);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('eventUtils', self.eventUtilsMock);
      $provide.value('user', self.userMock);
      $provide.value('cachedEventSource', self.cachedEventSourceMock);
      $provide.value('calendarCurrentView', self.calendarCurrentViewMock);
      $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      $provide.value('CalendarShell', self.CalendarShellMock);
      $provide.value('masterEventCache', self.masterEventCacheMock);
      $provide.value('calendarVisibilityService', self.calendarVisibilityServiceMock);
      $provide.value('usSpinnerService', self.usSpinnerServiceMock);
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
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$destroy();
    expect(this.gracePeriodService.flushAllTasks).to.have.been.called;
  });

  it('should register gracePeriodService.flushAllTasks on(\'beforeunload\')', function() {
    this.gracePeriodService.flushAllTasks = 'aHandler';
    var aEvent = null;
    var handler = null;

    this.$window.addEventListener = function(evt, hdlr) {
      aEvent = evt;
      handler = hdlr;
    };
    this.controller('calendarViewController', {$scope: this.scope});
    expect(aEvent).to.equal('beforeunload');
    expect(handler).to.equal('aHandler');
  });

  it('should cachedEventSource.resetCache $on(\'$destroy\')', function() {
    this.gracePeriodService.flushAllTasks = angular.noop;
    this.cachedEventSourceMock.resetChange = sinon.spy();
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$destroy();
    expect(this.cachedEventSourceMock.resetCache).to.have.been.called;
  });

  it('should be created and its scope initialized', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    expect(this.scope.uiConfig.calendar.eventRender).to.equal(this.scope.eventRender);
    expect(this.scope.uiConfig.calendar.eventAfterAllRender).to.equal(this.scope.resizeCalendarHeight);
  });

  function testRefetchEvent(nameOfTheTest, calendar_events) {
    it(nameOfTheTest, function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.rootScope.$broadcast(this.CALENDAR_EVENTS[calendar_events]);

      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('refetchEvents');
    });
  }

  describe('The CALENDAR_EVENTS.ITEM_MODIFICATION listener', function() {

    testRefetchEvent('should refresh the calendar', 'ITEM_MODIFICATION');
  });

  describe('The CALENDAR_EVENTS.ITEM_ADD listener', function() {
    testRefetchEvent('should refresh the calendar', 'ITEM_ADD');
  });

  describe('The CALENDAR_EVENTS.ITEM_REMOVE listener', function() {
    testRefetchEvent('should refresh the calendar', 'ITEM_REMOVE');
  });

  describe('The CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW_MODE listener', function() {
    it('should change the view mode of the calendar', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, 'viewType');

      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('changeView', 'viewType');
    });
  });

  describe('The CALENDAR_EVENTS.CALENDARS.CALENDAR_TODAY listener', function() {
    it('should change the view mode of the calendar', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TODAY, 'viewType');

      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('today');
    });
  });

  it('should call fullCalendar next on swipeRight', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.scope.swipeRight();
    this.scope.$digest();
    expect(fullCalendarSpy).to.have.been.calledWith('prev');
  });

  it('should call fullCalendar next on swipeLeft', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.scope.swipeLeft();
    this.scope.$digest();
    expect(fullCalendarSpy).to.have.been.calledWith('next');
  });

  it('should init list calendars and list of eventsSourceMap', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
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
  });

  it('should add source for each calendar which is not hidden', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.calendarVisibilityServiceMock.isHidden = sinon.stub();
    this.calendarVisibilityServiceMock.isHidden.onFirstCall().returns(false);
    this.calendarVisibilityServiceMock.isHidden.onSecondCall().returns(true);
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    expect(fullCalendarSpy).to.have.been.calledWith('addEventSource', this.scope.eventSourcesMap[this.calendars[0].href]);
    expect(fullCalendarSpy).to.not.have.been.calledWith('addEventSource', this.scope.eventSourcesMap[this.calendars[1].href]);
    expect(fullCalendarSpy).to.have.been.calledOnce;
  });

  it('should have wrap each calendar with cachedEventSource.wrapEventSource', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    expect(this.cachedEventSourceMock.wrapEventSource).to.have.been.calledTwice;
    expect(this.cachedEventSourceMock.wrapEventSource).to.have.been.calledWithExactly('id', sinon.match.array);

    expect(this.cachedEventSourceMock.wrapEventSource).to.have.been.calledWithExactly('id2', sinon.match.array);
  });

  it('should emit addEventSource on CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is false', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: false, calendar: {}});
    this.scope.$digest();

    expect(this.calendar.fullCalendar).to.have.been.calledWith('addEventSource');
  });

  it('should emit removeEventSource on CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is true', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: true, calendar: {}});
    this.scope.$digest();

    expect(this.calendar.fullCalendar).to.have.been.calledWith('removeEventSource');
  });

  it('should resize the calendar height twice when the controller is created', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    var uiCalendarDiv = this.$compile(angular.element('<esn-calendar config="uiConfig.calendar"></div>'))(this.scope);

    uiCalendarDiv.appendTo(document.body);
    this.scope.calendarReady(this.calendar);
    this.scope.uiConfig.calendar.viewRender();
    this.$timeout.flush();
    try {
      this.$timeout.flush();
    } catch (exception) {
      // Depending on the context, the 'no defered tasks' exception can occur
    }
    this.scope.$digest();
    expect(this.calendar.fullCalendar).to.have.been.calledWith('option', 'height');
    uiCalendarDiv.remove();
  });

  it('should change view on VIEW_TRANSLATION only when mobile mini calendar is hidden', function() {
    this.controller('calendarViewController', {$scope: this.scope});

    this.scope.calendarReady(this.calendar);

    var fcMethodMock = {
    };

    this.calendar.fullCalendar = function(action) {
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
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$digest();

    var uiCalendarDiv = this.$compile(angular.element('<esn-calendar config="uiConfig.calendar"></div>'))(this.scope);

    uiCalendarDiv.appendTo(document.body);
    this.$timeout.flush();
    try {
      this.$timeout.flush();
    } catch (exception) {
      // Depending on the context, the 'no defered tasks' exception can occur
    }

    this.scope.calendarReady(this.calendar);
    this.scope.$digest();

    var fullCalendarSpy = this.calendar.fullCalendar = sinon.spy();

    angular.element(this.$window).resize();
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    expect(fullCalendarSpy).to.be.calledWith('option', 'height');
    uiCalendarDiv.remove();
  });

  it('should resize the calendar height to a max value', function() {
    this.controller('calendarViewController', {$scope: this.scope});

    var uiCalendarDiv = this.$compile(angular.element('<esn-calendar config="uiConfig.calendar"></div>'))(this.scope);

    uiCalendarDiv.appendTo(document.body);
    this.$timeout.flush();
    try {
      this.$timeout.flush();
    } catch (exception) {
      // Depending on the context, the 'no defered tasks' exception can occur
    }

    angular.element(this.$window).resize();
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    expect(this.calendar.fullCalendar).to.have.been.calledWith('option', 'height', 10);
    uiCalendarDiv.remove();
  });

  it('should display an error if calendar events cannot be retrieved', function(done) {

    var calendarEventSourceMock = function(calendarId, errorCallback) { // eslint-disable-line
      errorCallback(new Error(), 'Can not get calendar events');
    };

    var $alertMock = function(alertObject) {
      expect(alertObject.show).to.be.true;
      expect(alertObject.content).to.equal('Can not get calendar events');
      done();
    };

    this.controller('calendarViewController', {
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

    this.controller('calendarViewController', {
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

    this.controller('calendarViewController', {
      $rootScope: this.rootScope,
      $scope: this.scope
    });

    expect(this.calendarCurrentViewMock.get).to.have.been.calledOnce;
    expect(this.scope.uiConfig.calendar.defaultView).to.equals('agendaDay');
    expect(this.scope.uiConfig.calendar.defaultDate).to.equals(date);
  });

  it('should save view with calendarCurrentView when view change', function() {
    var view = {};

    this.calendarCurrentViewMock.set = sinon.spy(function(_view) {
      expect(_view).to.equals(view);
    });

    this.controller('calendarViewController', {
      $rootScope: this.rootScope,
      $scope: this.scope
    });

    this.scope.uiConfig.calendar.viewRender(view);

    expect(this.calendarCurrentViewMock.set).to.have.been.calledOnce;
  });

  it('should call loading function to wait the events loading', function(done) {
    this.controller('calendarViewController', {$scope: this.scope});

    var isLoading = true;

    this.scope.uiConfig.calendar.loading(isLoading);
    expect(this.scope.hideCalendar).to.equal(isLoading);

    isLoading = false;
    this.scope.uiConfig.calendar.loading(isLoading);
    expect(this.scope.hideCalendar).to.equal(isLoading);

    expect(this.usSpinnerServiceMock.spin).to.have.been.calledOnce;
    expect(this.usSpinnerServiceMock.stop).to.have.been.calledOnce;

    done();
  });

  describe('the eventDropAndResize listener', function() {
    it('should call calendarService.modifyEvent with the correct argument if resize', function() {
      var oldEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.fcMoment('2016-01-01 09:00'),
        end: this.fcMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent; // eslint-disable-line
        }
      };

      var newEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.fcMoment('2016-01-01 09:00'),
        end: this.fcMoment('2016-01-01 10:10'),
        clone: function() {
          return oldEvent;
        }
      };

      var event = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.fcMoment('2016-01-01 09:00'),
        end: this.fcMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent;
        }
      };

      this.controller('calendarViewController', {$scope: this.scope});
      var delta = this.fcMoment.duration(10, 'minutes');

      this.scope.eventDropAndResize(false, event, delta);
      expect(oldEvent.start.isSame(this.fcMoment('2016-01-01 09:00'))).to.be.true;
      expect(oldEvent.end.isSame(this.fcMoment('2016-01-01 10:00'))).to.be.true;
      expect(this.eventServiceMock.modifyEvent).to.have.been.calledWith(newEvent.path, newEvent, oldEvent, newEvent.etag);
    });

    it('should call calendarService.modifyEvent with the correct argument if drop', function() {
      var oldEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.fcMoment('2016-01-01 09:00'),
        end: this.fcMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent; // eslint-disable-line
        }
      };

      var newEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.fcMoment('2016-01-01 09:00'),
        end: this.fcMoment('2016-01-01 10:10'),
        clone: function() {
          return oldEvent;
        }
      };

      var event = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.fcMoment('2016-01-01 09:00'),
        end: this.fcMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent;
        }
      };

      var delta = this.fcMoment.duration(10, 'minutes');

      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.eventDropAndResize(true, event, delta);

      expect(oldEvent.start.isSame(this.fcMoment('2016-01-01 08:50'))).to.be.true;
      expect(oldEvent.end.isSame(this.fcMoment('2016-01-01 10:00'))).to.be.true;
      expect(this.eventServiceMock.modifyEvent).to.have.been.calledWith(newEvent.path, newEvent, oldEvent, newEvent.etag);
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

      this.rootScope.$on(this.CALENDAR_EVENTS.REVERT_MODIFICATION, function(angularEvent, event) { // eslint-disable-line
        expect(event).to.equal(oldEvent);
        done();
      });

      this.eventServiceMock.modifyEvent = function(path, e, _oldEvent, etag, revertFunc) { // eslint-disable-line
        oldEvent = _oldEvent;
        revertFunc();

        return $q.when({});
      };

      this.controller('calendarViewController', {$scope: this.scope});
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

      this.eventServiceMock.modifyEvent = function(path, e, oldEvent, etag) { // eslint-disable-line
        expect(path).to.equal('/calendars/' + calendarHomeId + '/events');
        expect(etag).to.equal(event.etag);
        done();
      };
      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.eventDropAndResize(false, event, this.fcMoment.duration(10, 'seconds'));
    });

    it('should broadcast CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE when the view change', function(done) {
      this.controller('calendarViewController', {$scope: this.scope});

      var event = this.CalendarShell.fromIncompleteShell({
        etag: 'anEtag'
      });

      this.rootScope.$on(this.CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(angularEvent, _event) { // eslint-disable-line
        expect(_event).to.equals(event);
        done();
      });

      this.scope.uiConfig.calendar.viewRender(event);

    });

    it('should receive CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE and change view if needed', function(done) {
      this.controller('calendarViewController', {$scope: this.scope});
      var date = this.fcMoment('2015-01-13');
      var first = true;

      self = this;
      var spy = this.calendar.fullCalendar = sinon.spy(function(name, newDate) {
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
      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
    });

  });

  describe('the ws event listener', function() {

    var wsEventCreateListener, wsEventModifyListener, wsEventDeleteListener, wsEventRequestListener, wsEventReplyListener, wsEventCancelListener, testUpdateCachedEventSourceAndFcEmit, testUpdateMasterEventCache;

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

      this.controller('calendarViewController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });

      testUpdateCachedEventSourceAndFcEmit = function(wsCallback, expectedCacheMethod, expectedEmitMethod) {
        var event = {id: 'id', calendarId: 'calId'};
        var path = 'path';
        var etag = 'etag';
        var resultingEvent = self.CalendarShellMock.from(event, {etag: etag, path: path});

        fullCalendarSpy = self.calendar.fullCalendar = sinon.spy();

        self.scope.calendarReady(self.calendar);
        wsCallback({event: event, eventPath: path, etag: etag});
        self.scope.$digest();
        expect(self.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(self.calendarEventEmitterMock.fullcalendar[expectedEmitMethod]).to.have.been.calledWith(resultingEvent);
        expect(self.cachedEventSourceMock[expectedCacheMethod]).to.have.been.calledWith(resultingEvent);
      };

      testUpdateMasterEventCache = function(wsCallback, expectedCacheMethod) {
        var event = {id: 'id', calendarId: 'calId'};
        var path = 'path';
        var etag = 'etag';
        var resultingEvent = self.CalendarShellMock.from(event, {etag: etag, path: path});

        fullCalendarSpy = self.calendar.fullCalendar = sinon.spy();

        self.scope.calendarReady(self.calendar);
        wsCallback({event: event, eventPath: path, etag: etag});
        self.scope.$digest();
        expect(self.CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
        expect(self.masterEventCacheMock[expectedCacheMethod]).to.have.been.calledWith(resultingEvent);
      };

    });

    it('should update event on cachedEventSource and emit a fullCalendar event for a modification on EVENT_CREATED', function() {
      testUpdateCachedEventSourceAndFcEmit(wsEventCreateListener, 'registerUpdate', 'emitModifiedEvent');
    });

    it('should update event on cachedEventSource and broadcast emit a fullCalendar event for a modification on EVENT_REQUEST', function() {
      testUpdateCachedEventSourceAndFcEmit(wsEventRequestListener, 'registerUpdate', 'emitModifiedEvent');
    });

    it('should update event on cachedEventSource and broadcast emit a fullCalendar event for a modification on EVENT_UPDATED', function() {
      testUpdateCachedEventSourceAndFcEmit(wsEventModifyListener, 'registerUpdate', 'emitModifiedEvent');
    });

    it('should update event on cachedEventSource and broadcast emit a fullCalendar event for a modification on EVENT_REPLY', function() {
      testUpdateCachedEventSourceAndFcEmit(wsEventReplyListener, 'registerUpdate', 'emitModifiedEvent');
    });

    it('should remove event on cachedEventSource and broadcast emit a fullCalendar event for a deletion on EVENT_DELETED', function() {
      testUpdateCachedEventSourceAndFcEmit(wsEventDeleteListener, 'registerDelete', 'emitRemovedEvent');
    });

    it('should remove event on cachedEventSource and broadcast emit a fullClaendar event for a deletion on EVENT_CANCEL', function() {
      testUpdateCachedEventSourceAndFcEmit(wsEventCancelListener, 'registerDelete', 'emitRemovedEvent');
    });

    it('should update event on masterEventCache or a modification on EVENT_CREATED', function() {
      testUpdateMasterEventCache(wsEventCreateListener, 'save');
    });

    it('should update event on masterEventCache for a modification on EVENT_REQUEST', function() {
      testUpdateMasterEventCache(wsEventRequestListener, 'save');
    });

    it('should update event on masterEventCache for a modification on EVENT_UPDATED', function() {
      testUpdateMasterEventCache(wsEventModifyListener, 'save');
    });

    it('should update event on masterEventCache for a modification on EVENT_REPLY', function() {
      testUpdateMasterEventCache(wsEventReplyListener, 'save');
    });

    it('should remove event on masterEventCache for a deletion on EVENT_DELETED', function() {
      testUpdateMasterEventCache(wsEventDeleteListener, 'remove');
    });

    it('should remove event on masterEventCache for a deletion on EVENT_CANCEL', function() {
      testUpdateMasterEventCache(wsEventCancelListener, 'remove');
    });
  });
});
