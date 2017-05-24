'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarViewController', function() {
  var event; // eslint-disable-line
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
        return self.calMoment('2013-02-08 09:30');
      },
      getNewEndDate: function() {
        return self.calMoment('2013-02-08 10:30');
      }
    };

    this.calWebsocketListenerServiceMock = {
      listenEvents: sinon.spy(function() {
        return {
          clean: sinon.spy()
        };
      })
    };

    this.elementScrollServiceMock = {
      scrollToTop: sinon.spy()
    };

    this.calCachedEventSourceMock = {
      wrapEventSource: sinon.spy(function(id, eventSource) { // eslint-disable-line
        return eventSource;
      }),
      resetCache: sinon.spy(),
      registerUpdate: sinon.spy(),
      registerDelete: sinon.spy()
    };

    this.calMasterEventCacheMock = {
      save: sinon.spy(),
      get: sinon.spy(),
      remove: sinon.spy()
    };

    this.CalendarShellConstMock = sinon.spy(function(vcalendar, event) { // eslint-disable-line
      this.etag = event.etag;
      this.path = event.path;
      this.end = self.calMoment();
      this.clone = function() {
        return this;
      };
    });

    this.calendarVisibilityServiceMock = {
      isHidden: sinon.spy(function() {
        return self.$q.when(false);
      })
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
      uniqueId: 'id',
      color: 'color'
    }, {
      href: 'href2',
      uniqueId: 'id2',
      color: 'color2'
    }];

    this.calEventServiceMock = {
      createEvent: function() {
        return $q.when({});
      },
      modifyEvent: sinon.spy(function(path, e) { // eslint-disable-line
        event = e;

        return $q.when();
      })
    };

    this.calendarServiceMock = {
      calendarUniqueId: '1234',
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
    this.calEventUtilsMock = {
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
      $provide.value('elementScrollService', self.elementScrollServiceMock);
      $provide.value('calEventService', self.calEventServiceMock);
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('calEventUtils', self.calEventUtilsMock);
      $provide.value('user', self.userMock);
      $provide.value('calCachedEventSource', self.calCachedEventSourceMock);
      $provide.value('calendarCurrentView', self.calendarCurrentViewMock);
      $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      $provide.value('CalendarShell', self.CalendarShellMock);
      $provide.value('calMasterEventCache', self.calMasterEventCacheMock);
      $provide.value('calendarVisibilityService', self.calendarVisibilityServiceMock);
      $provide.value('calWebsocketListenerService', self.calWebsocketListenerServiceMock);
      $provide.value('usSpinnerService', self.usSpinnerServiceMock);
      $provide.value('calCachedEventCache', self.calCachedEventSourceMock);
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
      $provide.constant('CAL_MAX_CALENDAR_RESIZE_HEIGHT', 10);
    });
  });

  beforeEach(angular.mock.inject(function(
    $controller,
    $rootScope,
    $compile,
    $timeout,
    $window,
    CAL_UI_CONFIG,
    moment,
    CalendarShell,
    calMoment,
    CAL_EVENTS,
    calEventUtils,
    elementScrollService,
    $q,
    CAL_SPINNER_TIMEOUT_DURATION) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
    this.$compile = $compile;
    this.$timeout = $timeout;
    this.$window = $window;
    this.CAL_UI_CONFIG = CAL_UI_CONFIG;
    this.moment = moment;
    this.CalendarShell = CalendarShell;
    this.calMoment = calMoment;
    this.CAL_EVENTS = CAL_EVENTS;
    this.calEventUtils = calEventUtils;
    this.elementScrollService = elementScrollService;
    this.$q = $q;
    this.CAL_SPINNER_TIMEOUT_DURATION = CAL_SPINNER_TIMEOUT_DURATION;
  }));

  beforeEach(function() {
    this.scope.uiConfig = this.CAL_UI_CONFIG;
    this.scope.calendarHomeId = 'calendarId';
  });

  afterEach(function() {
    this.gracePeriodService.flushAllTasks = function() {};
    this.scope.$destroy();
  });

  it('should scroll to top when calling calendarViewController)', function() {
    this.gracePeriodService.flushAllTasks = sinon.spy();
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$destroy();

    expect(this.elementScrollService.scrollToTop).to.have.been.called;
  });

  it('should call calWebsocketListenerService.listenEvents', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$digest();

    expect(this.calWebsocketListenerServiceMock.listenEvents).to.have.been.calledOnce;
  });

  it('should clean calWebsocketListenerService listeners $on(\'$destroy\')', function() {
    var cleanSpy = sinon.spy();

    this.gracePeriodService.flushAllTasks = sinon.spy();
    this.calWebsocketListenerServiceMock.listenEvents = function() {
      return {
        clean: cleanSpy
      };
    };
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$digest();
    this.scope.$destroy();

    expect(cleanSpy).to.have.been.calledOnce;
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

  it('should calCachedEventSource.resetCache $on(\'$destroy\')', function() {
    this.gracePeriodService.flushAllTasks = angular.noop;
    this.calCachedEventSourceMock.resetChange = sinon.spy();
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$destroy();
    expect(this.calCachedEventSourceMock.resetCache).to.have.been.called;
  });

  it('should be created and its scope initialized', function() {
    this.controller('calendarViewController', {$scope: this.scope});

    expect(this.scope.uiConfig.calendar.eventRender).to.equal(this.calEventUtils.render);
    expect(this.scope.uiConfig.calendar.eventAfterAllRender).to.equal(this.scope.resizeCalendarHeight);
  });

  function testRefetchEvent(nameOfTheTest, calendar_events, calendarSpyCalledWith) {
    it(nameOfTheTest, function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.rootScope.$broadcast(this.CAL_EVENTS[calendar_events]);

      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith(calendarSpyCalledWith || 'refetchEvents');
    });
  }

  describe('the initialization', function() {
    it('should properly initialize $scope.calendars', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.$digest();

      expect(this.scope.calendars).to.deep.equal(this.calendars);
    });
  });

  describe('The CAL_EVENTS.ITEM_MODIFICATION listener', function() {
    testRefetchEvent('should refresh the calendar', 'ITEM_MODIFICATION');
  });

  describe('The CAL_EVENTS.ITEM_ADD listener', function() {
    testRefetchEvent('should refresh the calendar', 'ITEM_ADD');
  });

  describe('The CAL_EVENTS.ITEM_REMOVE listener', function() {
    testRefetchEvent('should refresh the calendar', 'ITEM_REMOVE');
  });

  describe('The CAL_EVENTS.CALENDAR_UNSELECT listener', function() {
    testRefetchEvent('should unselect the calendar', 'CALENDAR_UNSELECT', 'unselect');
  });

  describe('The CAL_EVENTS.CALENDARS.UPDATE listener', function() {
    it('should update $scope.calendars correctly', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.calendars = [{uniqueId: 1}, {uniqueId: 2}];
      var newCal = {uniqueId: 2, data: 'data'};

      this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.UPDATE, newCal);
      expect(this.scope.calendars).to.be.deep.equal([{uniqueId: 1}, newCal]);
    });
  });

  describe('The CAL_EVENTS.CALENDAR_REFRESH listener', function() {
    testRefetchEvent('should refresh the calendar', 'CALENDAR_REFRESH');
  });

  describe('The CAL_EVENTS.CALENDARS.REMOVE listener', function() {
    it('should remove the calendar on $scope.calendars correctly', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.calendars = [{uniqueId: 1}, {uniqueId: 2}];
      this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.REMOVE, {uniqueId: 2});
      expect(this.scope.calendars).to.be.deep.equal([{uniqueId: 1}]);
    });

    it('should remove the corresponding source map correctly', function() {
      var source = {
        backgroundColor: 'black',
        events: function() {
          return [];
        }
      };

      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      this.scope.eventSourcesMap = {calendarUniqueId: source};
      this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.REMOVE, {uniqueId: 'calendarUniqueId'});
      this.scope.calendarReady(this.calendar);
      this.scope.$digest();

      expect(this.scope.eventSourcesMap['2']).to.be.undefined;
      expect(fullCalendarSpy).to.have.been.calledWith('removeEventSource', sinon.match.same(source));
    });
  });

  describe('The CAL_EVENTS.CALENDARS.ADD listener', function() {
    it('should add an event source for this calendar in fullcalendar', function() {
      var calendar = {href: 'href', uniqueId: 'id', color: 'color'};
      var source = 'source';
      var wrappedSource = 'source';
      var calendarEventSourceMock = sinon.stub().returns(source);

      this.calCachedEventSourceMock.wrapEventSource = sinon.stub().returns(wrappedSource);
      this.controller('calendarViewController', {
        $scope: this.scope,
        calendarEventSource: calendarEventSourceMock
      });
      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.ADD, calendar);
      expect(calendarEventSourceMock).to.have.been.calledWith(calendar, this.scope.displayCalendarError);
      expect(this.calCachedEventSourceMock.wrapEventSource).to.have.been.calledWith('id', source);
      expect(this.scope.eventSourcesMap.id).to.deep.equals({
        events: wrappedSource,
        backgroundColor: 'color'
      });

      expect(fullCalendarSpy).to.have.been.calledWith('addEventSource', this.scope.eventSourcesMap.id);
    });
  });

  describe('The CAL_EVENTS.CALENDARS.TOGGLE_VIEW_MODE listener', function() {
    it('should change the view mode of the calendar', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, 'viewType');

      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
      expect(fullCalendarSpy).to.have.been.calledWith('changeView', 'viewType');
    });
  });

  describe('The CAL_EVENTS.CALENDARS.CALENDAR_TODAY listener', function() {
    it('should change the view mode of the calendar', function() {
      this.controller('calendarViewController', {$scope: this.scope});
      this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.TODAY, 'viewType');

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
    expect(this.scope.eventSourcesMap.id.backgroundColor).to.equal('color');
    expect(this.scope.eventSourcesMap.id2.backgroundColor).to.equal('color2');
    expect(this.scope.eventSourcesMap.id.events).to.be.a('Array');
    expect(this.scope.eventSourcesMap.id2.events).to.be.a('Array');
  });

  it('should add source for each calendar which is not hidden', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.calendarVisibilityServiceMock.isHidden = sinon.stub();
    this.calendarVisibilityServiceMock.isHidden
      .onFirstCall()
      .returns(this.$q.when(false));
    this.calendarVisibilityServiceMock.isHidden
      .onSecondCall()
      .returns(this.$q.when(true));

    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    expect(fullCalendarSpy).to.have.been.calledWith('addEventSource', this.scope.eventSourcesMap[this.calendars[0].uniqueId]);
    expect(fullCalendarSpy).to.not.have.been.calledWith('addEventSource', this.scope.eventSourcesMap[this.calendars[1].uniqueId]);
    expect(fullCalendarSpy).to.have.been.calledOnce;
  });

  it('should have wrap each calendar with calCachedEventSource.wrapEventSource', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    expect(this.calCachedEventSourceMock.wrapEventSource).to.have.been.calledTwice;
    expect(this.calCachedEventSourceMock.wrapEventSource).to.have.been.calledWithExactly('id', sinon.match.array);

    expect(this.calCachedEventSourceMock.wrapEventSource).to.have.been.calledWithExactly('id2', sinon.match.array);
  });

  it('should emit addEventSource on CAL_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is false', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.scope.$digest();
    this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: false, calendarUniqueId: 'calendarUniqueId' });
    this.scope.$digest();

    expect(this.calendar.fullCalendar).to.have.been.calledWith('addEventSource');
  });

  it('should emit removeEventSource on CAL_EVENTS.CALENDARS.TOGGLE_VIEW and eventData.hidden is true', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.calendarReady(this.calendar);
    this.rootScope.$broadcast(this.CAL_EVENTS.CALENDARS.TOGGLE_VIEW, {hidden: true, calendar: {}});
    this.scope.$digest();

    expect(this.calendar.fullCalendar).to.have.been.calledWith('removeEventSource');
  });

  it('should resize the calendar height twice when the controller is created', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    var uiCalendarDiv = this.$compile(angular.element('<esn-calendar config="uiConfig.calendar" calendar-ready="calendarReady"></div>'))(this.scope);

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
      this.rootScope.$broadcast(this.CAL_EVENTS.VIEW_TRANSLATION, action);

      this.rootScope.$broadcast(this.CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      this.rootScope.$broadcast(this.CAL_EVENTS.VIEW_TRANSLATION, action);

      this.rootScope.$broadcast(this.CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      this.rootScope.$broadcast(this.CAL_EVENTS.VIEW_TRANSLATION, action);

      this.scope.$digest();
      expect(fcMethodMock[action]).to.have.been.calleTwice;
    }, this);
  });

  it('should resize the calendar height once when the window is resized', function() {
    this.controller('calendarViewController', {$scope: this.scope});
    this.scope.$digest();

    var uiCalendarDiv = this.$compile(angular.element('<esn-calendar config="uiConfig.calendar" calendar-ready="calendarReady"></div>'))(this.scope);

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

    this.scope.calendarReadyNoop = angular.noop;
    var uiCalendarDiv = this.$compile(angular.element('<esn-calendar config="uiConfig.calendar" calendar-ready="calendarReadyNoop"></div>'))(this.scope);

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

    var calendarEventSourceMock = function(calendarUniqueId, errorCallback) { // eslint-disable-line
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

  it('should restore view from calendarCurrentView during initialization', function() {
    var date = this.calMoment('1953-03-16');

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

  describe('the loading function', function() {
    it('should spin the throbber when isLoading is true after CAL_SPINNER_TIMEOUT_DURATION', function(done) {
      var isLoading = true;

      this.controller('calendarViewController', {$scope: this.scope});

      this.scope.uiConfig.calendar.loading(isLoading);
      this.$timeout.flush(this.CAL_SPINNER_TIMEOUT_DURATION - 1);

      expect(this.scope.hideCalendar).to.be.undefined;
      expect(this.usSpinnerServiceMock.spin).to.not.have.been.called;

      this.$timeout.flush(1);

      expect(this.scope.hideCalendar).to.equal(isLoading);
      expect(this.usSpinnerServiceMock.spin).to.have.been.calledOnce;

      done();
    });

    it('should stop the throbber loading and cancel any pending timeout when isLoading is false', function(done) {
      var isLoading = false;
      sinon.spy(this.$timeout, 'cancel');

      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.uiConfig.calendar.loading(isLoading);
      this.$timeout.flush();

      expect(this.scope.hideCalendar).to.equal(isLoading);
      expect(this.usSpinnerServiceMock.stop).to.have.been.calledOnce;
      expect(this.$timeout.cancel).to.have.been.called;

      done();
    });
  });

  describe('the eventDropAndResize listener', function() {
    it('should call calendarService.modifyEvent with the correct argument if resize', function() {
      var oldEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.calMoment('2016-01-01 09:00'),
        end: this.calMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent; // eslint-disable-line
        }
      };

      var newEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.calMoment('2016-01-01 09:00'),
        end: this.calMoment('2016-01-01 10:10'),
        clone: function() {
          return oldEvent;
        }
      };

      var event = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.calMoment('2016-01-01 09:00'),
        end: this.calMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent;
        }
      };

      this.controller('calendarViewController', {$scope: this.scope});
      var delta = this.calMoment.duration(10, 'minutes');

      this.scope.eventDropAndResize(false, event, delta);
      expect(oldEvent.start.isSame(this.calMoment('2016-01-01 09:00'))).to.be.true;
      expect(oldEvent.end.isSame(this.calMoment('2016-01-01 10:00'))).to.be.true;
      expect(this.calEventServiceMock.modifyEvent).to.have.been.calledWith(newEvent.path, newEvent, oldEvent, newEvent.etag);
    });

    it('should call calendarService.modifyEvent with the correct argument if drop', function() {
      var oldEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.calMoment('2016-01-01 09:00'),
        end: this.calMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent; // eslint-disable-line
        }
      };

      var newEvent = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.calMoment('2016-01-01 09:00'),
        end: this.calMoment('2016-01-01 10:10'),
        clone: function() {
          return oldEvent;
        }
      };

      var event = {
        path: 'aPath',
        etag: 'anEtag',
        start: this.calMoment('2016-01-01 09:00'),
        end: this.calMoment('2016-01-01 10:10'),
        clone: function() {
          return newEvent;
        }
      };

      var delta = this.calMoment.duration(10, 'minutes');

      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.eventDropAndResize(true, event, delta);

      expect(oldEvent.start.isSame(this.calMoment('2016-01-01 08:50'))).to.be.true;
      expect(oldEvent.end.isSame(this.calMoment('2016-01-01 10:00'))).to.be.true;
      expect(this.calEventServiceMock.modifyEvent).to.have.been.calledWith(newEvent.path, newEvent, oldEvent, newEvent.etag);
    });

    it('should send a CAL_EVENTS.REVERT_MODIFICATION with the event after calling fullcalendar revert when the drap and drop if reverted', function(done) {
      var event = {
        path: 'aPath',
        etag: 'anEtag',
        end: this.calMoment(),
        clone: function() {
          return event;
        }
      };

      this.scope.event = event;

      var oldEvent;

      this.rootScope.$on(this.CAL_EVENTS.REVERT_MODIFICATION, function(angularEvent, event) { // eslint-disable-line
        expect(event).to.equal(oldEvent);
        done();
      });

      this.calEventServiceMock.modifyEvent = function(path, e, _oldEvent, etag, revertFunc) { // eslint-disable-line
        oldEvent = _oldEvent;
        revertFunc();

        return $q.when({});
      };

      this.controller('calendarViewController', {$scope: this.scope});
      var fcRevert = sinon.spy();

      this.scope.eventDropAndResize(false, event, this.calMoment.duration(10), fcRevert);
      expect(this.calEventUtilsMock.setBackgroundColor).to.have.been.calledWith(event, this.calendars);
      expect(fcRevert).to.have.been.calledOnce;
    });

    it('should call calendarService.modifyEvent with a built path if scope.event.path does not exist', function(done) {
      var event = {
        etag: 'anEtag',
        end: this.calMoment(),
        clone: function() {
          return event;
        }
      };
      var calendarHomeId = 'calendarHomeId';

      this.scope.calendarHomeId = calendarHomeId;
      this.scope.event = event;

      this.calEventServiceMock.modifyEvent = function(path, e, oldEvent, etag) { // eslint-disable-line
        expect(path).to.equal('/calendars/' + calendarHomeId + '/events');
        expect(etag).to.equal(event.etag);
        done();
      };
      this.controller('calendarViewController', {$scope: this.scope});
      this.scope.eventDropAndResize(false, event, this.calMoment.duration(10, 'seconds'));
    });

    it('should broadcast CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE when the view change', function(done) {
      this.controller('calendarViewController', {$scope: this.scope});

      var event = this.CalendarShell.fromIncompleteShell({
        etag: 'anEtag'
      });

      this.rootScope.$on(this.CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(angularEvent, _event) { // eslint-disable-line
        expect(_event).to.equals(event);
        done();
      });

      this.scope.uiConfig.calendar.viewRender(event);

    });

    it('should receive CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE and change view if needed', function(done) {
      this.controller('calendarViewController', {$scope: this.scope});
      var date = this.calMoment('2015-01-13');
      var first = true;

      self = this;
      var spy = this.calendar.fullCalendar = sinon.spy(function(name, newDate) {
        if (name === 'getView') {
          if (first) {
            first = false;
            self.rootScope.$broadcast(self.CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, date);
          }

          return {
            start: self.calMoment('2015-01-01'),
            end: self.calMoment('2015-01-10')
          };
        }
        if (name === 'gotoDate') {
          expect(newDate.isSame(date, 'day')).to.be.true;
          expect(spy).to.be.calledTwice;
          done();
        }
      });

      this.rootScope.$broadcast(this.CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, this.calMoment('2015-01-13'));
      this.scope.calendarReady(this.calendar);
      this.scope.$digest();
    });

  });
});
