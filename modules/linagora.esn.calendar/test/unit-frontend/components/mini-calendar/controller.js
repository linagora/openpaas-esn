'use strict';
/* global chai: false */
/* global sinon: false */
/* global _: false */
var expect = chai.expect;

describe('The mini-calendar controller', function() {

  var $scope, $timeout, $rootScope, $controller, $q, $window, fcMoment, fcMethodMock, calendarServiceMock, initController,
    sessionMock, miniCalendarServiceMock, calendarEventSourceMock, UI_CONFIG_MOCK, calendar, uiCalendarConfigMock,
    calendarCurrentViewMock, CALENDAR_EVENTS, keepChangeDuringGraceperiodMock, uniqueId, uuid4Mock, liveNotification,
    liveNotificationMock, CalendarShellMock, CalendarShellConstMock, calWrapper;

  function sameDayMatcher(day) {
    return function(_day) {
      return _day && _day.isSame(day, 'day');
    };
  }

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    angular.mock.module('ui.calendar', function($provide) {
      $provide.constant('uiCalendarConfig', uiCalendarConfigMock);
    });

    sessionMock = {
      user: {
        _id: 'userId'
      }
    };

    calendarServiceMock = {
      listCalendars: function(userId) {
        expect(userId).to.equals(sessionMock.user._id);
        var deferred = $q.defer();
        deferred.resolve([{
          href: 'href',
          id: 'id'
        }]);
        return deferred.promise;
      }
    };

    CalendarShellConstMock = function(vcalendar, event) {
      this.etag = event.etag;
      this.path = event.path;
      this.end = fcMoment();
      this.clone = function() {
        return this;
      };
    };

    CalendarShellMock = function() {
      return CalendarShellConstMock.apply(this, arguments);
    };

    CalendarShellMock.from = sinon.spy(function(event, extendedProp) {
      return angular.extend({}, event, extendedProp);
    });

    liveNotificationMock = function(namespace) {
      return liveNotification ? liveNotification(namespace) : {
        on: angular.noop,
        removeListener: angular.noop
      };
    };

    keepChangeDuringGraceperiodMock = {
      wrapEventSource: sinon.spy(function(id, source) {
        return source;
      })
    };

    uniqueId = 'this is supposed to be a very unique id';

    miniCalendarServiceMock = {
      getWeekAroundDay: sinon.stub().returns({firstWeekDay: null, nextFirstWeekDay: null}),
      miniCalendarWrapper: angular.identity
    };

    uuid4Mock = {
      generate: sinon.stub().returns(uniqueId)
    };

    calendarEventSourceMock = {};

    calendarCurrentViewMock = {
      save: angular.noop,
      get: sinon.stub().returns({})
    };

    fcMethodMock = {
      select: sinon.spy(),
      unselect: sinon.spy(),
      render: sinon.spy(),
      gotoDate: sinon.spy(),
      prev: sinon.spy(),
      next: sinon.spy()
    };

    calendar = {
      fullCalendar: function(name) {
        return fcMethodMock[name].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    };

    uiCalendarConfigMock = {
      calendars: {}
    };

    uiCalendarConfigMock.calendars[uniqueId] = calendar;

    calendarEventSourceMock = function(href) {
      expect(href).to.equals('href');
      return ['anEventSource'];
    };

    UI_CONFIG_MOCK = {
      calendar: {
        defaultView: 'agendaDay'
      }
    };

    calWrapper = {
      modifyEvent: sinon.spy(),
      addEvent: sinon.spy(),
      removeEvent: sinon.spy()
    };

    miniCalendarServiceMock.miniCalendarWrapper = sinon.stub().returns(calWrapper);

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('calendarService', calendarServiceMock);
      $provide.value('calendarEventSource', calendarEventSourceMock);
      $provide.value('uiCalendarConfig', uiCalendarConfigMock);
      $provide.value('miniCalendarService', miniCalendarServiceMock);
      $provide.value('keepChangeDuringGraceperiod', keepChangeDuringGraceperiodMock);
      $provide.value('calendarCurrentView', calendarCurrentViewMock);
      $provide.value('uuid4', uuid4Mock);
      $provide.constant('UI_CONFIG', UI_CONFIG_MOCK);
      $provide.value('livenotification', liveNotificationMock);
      $provide.value('CalendarShell', CalendarShellMock);
    });

  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _fcMoment_, _$q_, _$timeout_, _$window_, _CALENDAR_EVENTS_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    fcMoment = _fcMoment_;
    $q = _$q_;
    $timeout = _$timeout_;
    $window = _$window_;
    CALENDAR_EVENTS = _CALENDAR_EVENTS_;
    initController = function() {
      $controller('miniCalendarController', {$scope: $scope});
    };

  }));

  afterEach(function() {
    $scope.$destroy();
  });

  it('should $rootScope.broadcast the view on viewRender call', function() {
    var handler = sinon.spy();
    $scope.$on('calendar:mini:viewchange', handler);
    initController();
    $scope.miniCalendarConfig.viewRender('aView');
    expect(handler).to.have.been.calledWith(sinon.match.any, 'aView');
  });

  it('should call render on window resize if viewRender was never called', function() {
    initController();
    angular.element($window).resize();
    $scope.miniCalendarConfig.viewRender();
    angular.element($window).resize();
    expect(fcMethodMock.render).to.have.been.calledOnce;
  });

  it('should change view on VIEW_TRANSLATION only when mobile mini calendar is displayed', function() {
    initController();
    ['prev', 'next'].forEach(function(action) {
      $scope.miniCalendarConfig.viewRender();

      $rootScope.$broadcast(CALENDAR_EVENTS.VIEW_TRANSLATION, action);

      $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
      $rootScope.$broadcast(CALENDAR_EVENTS.VIEW_TRANSLATION, action);

      $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
      $rootScope.$broadcast(CALENDAR_EVENTS.VIEW_TRANSLATION, action);

      $rootScope.$digest();
      expect(fcMethodMock[action]).to.have.been.calledOnce;
    });
  });

  it('should call fullCalendar next on swipeRight', function() {
    initController();
    $scope.miniCalendarConfig.viewRender();
    $scope.swipeRight();
    $scope.$digest();
    expect(fcMethodMock.prev).to.have.been.calledOnce;
  });

  it('should call fullCalendar next on swipeLeft', function() {
    initController();
    $scope.miniCalendarConfig.viewRender();
    $scope.swipeLeft();
    $scope.$digest();
    expect(fcMethodMock.next).to.have.been.calledOnce;
  });

  describe('The selection of period in the mini calendar', function() {

    var firstWeekDay, dayInWeek, lastWeekDay;
    beforeEach(function() {
      firstWeekDay = fcMoment('2015-11-30');
      dayInWeek = fcMoment('2015-12-04');
      lastWeekDay = fcMoment('2015-12-07');
      initController();
    });

    it('should use uuid4.generate for miniCalendarId', function() {
      expect(uuid4Mock.generate).to.have.been.calledOnce;
      expect($scope.miniCalendarId).to.equal(uniqueId);
    });

    it('should select and go to the current view when initializing the mini calendar', function() {
      var day = fcMoment('1940-03-10');

      calendarCurrentViewMock.get = sinon.stub().returns({
        name: 'agendaDay',
        start: day
      });

      initController();

      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();

      expect(fcMethodMock.gotoDate).to.have.been.calledWith(sinon.match(sameDayMatcher(day)));

      expect(fcMethodMock.select).to.have.been.called;
      expect(calendarCurrentViewMock.get).to.have.been.called;
      expect($scope.homeCalendarViewMode).to.equals('agendaDay');
    });

    it('should broadcast CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE when a day is selected', function(done) {
      var day = fcMoment();

      $scope.miniCalendarConfig.viewRender();

      var unregister = $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, function(event, _day) {
        expect(day.isSame(_day, 'day')).to.be.true;
        unregister();
        done();
      });

      $scope.miniCalendarConfig.select(day, null, true, null);
    });

    it('should broadcast CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE when a day is selected', function(done) {
      var day = fcMoment();
      $scope.miniCalendarConfig.viewRender();

      var unregister = $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, function() {
        unregister();
        done();
      });

      $scope.miniCalendarConfig.select(day, null, true, null);
    });

    it('should broadcast CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, when a event is clicked, the day sent with this event should be the day where the event is', function(done) {
      var day = fcMoment();
      $scope.miniCalendarConfig.viewRender();

      var unregister = $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, function(event, _day) {
        expect(day.isSame(_day, 'day')).to.be.true;
        unregister();
        done();
      });

      $scope.miniCalendarConfig.eventClick({start: day});
    });

    it('should broadcast CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, when a event is clicked', function(done) {
      var day = fcMoment();
      $scope.miniCalendarConfig.viewRender();

      var unregister = $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, function() {
        unregister();
        done();
      });

      $scope.miniCalendarConfig.eventClick({start: day});
    });

    it('should select the good period on CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE event with day as viewMode', function(done) {
      var day = fcMoment();
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();

      fcMethodMock.select = function(start, end) {
        expect(day.isSame(start, 'days')).to.be.true;
        day.add(1, 'days');
        expect(day.isSame(end, 'days')).to.be.true;
        done();
      };

      $rootScope.$broadcast(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'agendaDay', start: day});
      $scope.$digest();
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in day view', function() {
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();
      var day = fcMoment();

      $scope.homeCalendarViewMode = 'agendaDay';

      $scope.miniCalendarConfig.select(day, null, true, null);
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(day)), sinon.match(sameDayMatcher(day.clone().add(1, 'day'))));
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in week view', function() {
      $scope.homeCalendarViewMode = 'agendaWeek';
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();

      miniCalendarServiceMock.getWeekAroundDay = sinon.spy(function(config, day) {
        expect(config).to.equals($scope.miniCalendarConfig);
        expect(day.isSame(dayInWeek, 'day')).to.be.true;
        return {firstWeekDay: firstWeekDay, nextFirstWeekDay: lastWeekDay};
      });

      $scope.miniCalendarConfig.select(dayInWeek, null, true, null);
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(firstWeekDay)), sinon.match(sameDayMatcher(lastWeekDay)));
      expect(miniCalendarServiceMock.getWeekAroundDay).to.have.been.called;
    });

    it('should select the good period on CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE with week as view mode', function() {
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();

      miniCalendarServiceMock.getWeekAroundDay = sinon.stub().returns({firstWeekDay: firstWeekDay, nextFirstWeekDay: lastWeekDay});

      $rootScope.$broadcast(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'agendaWeek', start: dayInWeek});
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(firstWeekDay)), sinon.match(sameDayMatcher(lastWeekDay)));
      expect(miniCalendarServiceMock.getWeekAroundDay).to.have.been.calledWith($scope.miniCalendarConfig, sinon.match(sameDayMatcher(dayInWeek)));
    });

    it('should unselect on CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE with month as view mode', function() {
      $scope.miniCalendarConfig.viewRender();

      $rootScope.$broadcast(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'month', start: null});
      $scope.$digest();
      expect(fcMethodMock.unselect).to.have.been.called;
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in month view', function() {
      $scope.miniCalendarConfig.viewRender();
      var day = fcMoment();
      $scope.homeCalendarViewMode = 'month';

      $scope.miniCalendarConfig.select(day, null, true, null);
      $scope.$digest();
      expect(fcMethodMock.unselect).to.have.been.called;
    });

  });

  describe('the synchronization of events between the home calendar and the mini calendar', function() {

    beforeEach(function() {
      initController();
    });

    it('should wrap calendars inside a miniCalendarWrapper', function() {
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();
      expect(miniCalendarServiceMock.miniCalendarWrapper).to.have.been.calledWith(calendar, ['anEventSource']);
    });

    it('should wrap calendars inside keepChangeDuringGraceperiod.wrapEventSource', function() {
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();
      expect(keepChangeDuringGraceperiodMock.wrapEventSource).to.have.been.calledWith('id', ['anEventSource']);
    });

    it('should call calWrapper.addEvent on CALENDAR_EVENTS.ITEM_ADD', function() {
      var event = {id: 'anId', start: fcMoment()};
      calWrapper.addEvent = sinon.spy();
      $scope.miniCalendarConfig.viewRender();
      $rootScope.$broadcast(CALENDAR_EVENTS.ITEM_ADD, event);
      $scope.$digest();
      expect(calWrapper.addEvent).to.have.been.calledWith(event);
    });

    it('should call calWrapper.addEvent on CALENDAR_EVENTS.ITEM_ADD with expanded events for reccurring event', function() {
      var sub = {id: 'sub', start: fcMoment()};
      var master = {
        id: 'master',
        start: fcMoment(),
        isRecurring: sinon.stub().returns(true),
        expand: sinon.stub().returns([sub])
      };

      var start = fcMoment('2016-03-03');
      var end = fcMoment('2016-03-04');
      calWrapper.modifyEvent = sinon.spy();
      fcMethodMock.getView = sinon.stub().returns({
        start: start,
        end: end
      });
      calWrapper.addEvent = sinon.spy();
      $scope.miniCalendarConfig.viewRender();
      $rootScope.$broadcast(CALENDAR_EVENTS.ITEM_ADD, master);
      $scope.$digest();
      expect(fcMethodMock.getView).to.have.been.called;
      expect(master.expand).to.have.been.calledWith(start.clone().subtract(1, 'day'), end.clone().add(1, 'day'));
      expect(calWrapper.addEvent).to.have.not.been.calledWith(master);
      expect(calWrapper.addEvent).to.have.been.calledWith(sub);
    });

    it('should call calWrapper.deleteEvent on CALENDAR_EVENTS.ITEM_REMOVE', function(done) {
      var id = 'anId';

      calWrapper.removeEvent = function(_id) {
        expect(_id).to.equals(id);
        done();
      };

      $scope.miniCalendarConfig.viewRender();
      $rootScope.$broadcast(CALENDAR_EVENTS.ITEM_REMOVE, id);
      $scope.$digest();
    });

    function testModifyEvent(nameOfEvent) {
      return function() {
        var event = {id: 'anId', start: fcMoment()};

        calWrapper.modifyEvent = sinon.spy();
        $scope.miniCalendarConfig.viewRender();
        $rootScope.$broadcast(CALENDAR_EVENTS[nameOfEvent], event);
        $scope.$digest();
        expect(calWrapper.modifyEvent).to.have.been.calledWith(event);
      };
    }

    function testModifyForReccurringEvent(nameOfEvent) {
      return function() {
        var sub = {id: 'sub', start: fcMoment()};
        var master = {
          id: 'master',
          start: fcMoment(),
          isRecurring: sinon.stub().returns(true),
          expand: sinon.stub().returns([sub])
        };

        var start = fcMoment('2016-03-03');
        var end = fcMoment('2016-03-04');
        calWrapper.modifyEvent = sinon.spy();
        fcMethodMock.getView = sinon.stub().returns({
          start: start,
          end: end
        });
        $scope.miniCalendarConfig.viewRender();
        $rootScope.$broadcast(CALENDAR_EVENTS[nameOfEvent], master);
        $scope.$digest();
        expect(fcMethodMock.getView).to.have.been.called;
        expect(master.expand).to.have.been.calledWith(start.clone().subtract(1, 'day'), end.clone().add(1, 'day'));
        expect(calWrapper.modifyEvent).to.not.have.been.calledWith(master);
        expect(calWrapper.modifyEvent).to.have.been.calledWith(sub);
      };
    }

    it('should call calWrapper.modifyEvent on modifiedCalendarItem', testModifyEvent('ITEM_MODIFICATION'));

    it('should call calWrapper.modifyEvent on revertedCalendarItemModification', testModifyEvent('REVERT_MODIFICATION'));

    it('should call calWrapper.modifyEvent on modifiedCalendarItem with expanded events for recurring event', testModifyForReccurringEvent('ITEM_MODIFICATION'));

    it('should call calWrapper.modifyEvent on revertedCalendarItemModification with expanded events for recurreng event', testModifyForReccurringEvent('REVERT_MODIFICATION'));
  });

  describe('the ws event listener', function() {

    var wsEventCreateListener, wsEventModifyListener, wsEventDeleteListener, wsEventRequestListener, wsEventReplyListener, wsEventCancelListener;

    beforeEach(function() {
      liveNotification = function(namespace) {
        expect(namespace).to.equal('/calendars');
        return {
          removeListener: sinon.spy(),
          on: function(event, handler) {
            switch (event) {
              case CALENDAR_EVENTS.WS.EVENT_CREATED:
                wsEventCreateListener = handler;
                break;
              case CALENDAR_EVENTS.WS.EVENT_UPDATED:
                wsEventModifyListener = handler;
                break;
              case CALENDAR_EVENTS.WS.EVENT_DELETED:
                wsEventDeleteListener = handler;
                break;
              case CALENDAR_EVENTS.WS.EVENT_REQUEST:
                wsEventRequestListener = handler;
                break;
              case CALENDAR_EVENTS.WS.EVENT_REPLY:
                wsEventReplyListener = handler;
                break;
              case CALENDAR_EVENTS.WS.EVENT_CANCEL:
                wsEventCancelListener = handler;
                break;
            }
          }
        };
      };

      initController();
    });

    it('should register a callback for EVENT_CREATED and pass the event to miniCalendarWrapper.addEvent', function() {
      var event = {id: 'anId', isRecurring: _.constant(false)};
      var path = 'path';
      var etag = 'etag';

      $scope.miniCalendarConfig.viewRender();
      wsEventCreateListener({event: event, eventPath: path, etag: etag});
      $scope.$digest();
      expect(CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
      expect(calWrapper.addEvent).to.have.been.calledWith(sinon.match(event));
    });

    it('should register a callback for EVENT_CREATED and pass the subevent of a recurrung event to miniCalendarWrapper.addEvent', function() {
      var subevent = {
        id: 'subevent',
        isRecurring: _.constant(false)
      };

      var event = {
        id: 'anId',
        isRecurring: _.constant(true),
        expand: sinon.stub().returns([subevent])
      };
      var path = 'path';
      var etag = 'etag';

      var start = fcMoment('2016-03-14');
      var end = fcMoment('2016-03-14');

      fcMethodMock.getView = sinon.stub().returns({start: start, end: end});
      $scope.miniCalendarConfig.viewRender();
      wsEventCreateListener({event: event, eventPath: path, etag: etag});
      $scope.$digest();
      expect(CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
      expect(calWrapper.addEvent).to.have.been.calledWith(sinon.match(subevent));
      expect(fcMethodMock.getView).to.have.been.called;
      expect(event.expand).to.have.been.calledWith(start.subtract(1, 'day'), end.add(1, 'day'));
    });

    it('should register a callback for EVENT_DELETED and pass the event to miniCalendarWrapper.deleteEvent', function() {
      var event = {id: 'anId', isRecurring: _.constant(false)};
      var path = 'path';
      var etag = 'etag';

      $scope.miniCalendarConfig.viewRender();
      wsEventDeleteListener({event: event, eventPath: path, etag: etag});
      $scope.$digest();
      expect(CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
      expect(calWrapper.removeEvent).to.have.been.calledWith(event.id);
    });

    it('should register a callback for EVENT_CANCEL and pass the event to miniCalendarWrapper.deleteEvent', function() {
      var event = {id: 'anId', isRecurring: _.constant(false)};
      var path = 'path';
      var etag = 'etag';

      $scope.miniCalendarConfig.viewRender();
      wsEventCancelListener({event: event, eventPath: path, etag: etag});
      $scope.$digest();
      expect(CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
      expect(calWrapper.removeEvent).to.have.been.calledWith(event.id);
    });

    it('should register a callback for EVENT_UPDATED and pass the event to miniCalendarWrapper.modifyEvent', function() {
      var event = {id: 'anId', isRecurring: _.constant(false)};
      var path = 'path';
      var etag = 'etag';

      $scope.miniCalendarConfig.viewRender();
      wsEventModifyListener({event: event, eventPath: path, etag: etag});
      $scope.$digest();
      expect(CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
      expect(calWrapper.modifyEvent).to.have.been.calledWith(sinon.match(event));
    });

    it('should register a callback for EVENT_REQUEST and pass the event to miniCalendarWrapper.modifyEvent', function() {
      var event = {id: 'anId', isRecurring: _.constant(false)};
      var path = 'path';
      var etag = 'etag';

      $scope.miniCalendarConfig.viewRender();
      wsEventRequestListener({event: event, eventPath: path, etag: etag});
      $scope.$digest();
      expect(CalendarShellMock.from).to.have.been.calledWith(event, {path: path, etag: etag});
      expect(calWrapper.modifyEvent).to.have.been.calledWith(sinon.match(event));
    });

    it('should not register a callback for EVENT_REPLY', function() {
      expect(wsEventReplyListener).to.be.undefined;
    });

  });
});
