'use strict';
/* global chai, sinon: false */
var expect = chai.expect;

describe('The mini-calendar controller', function() {

  var $scope, $rootScope, $controller, $q, $window, fcMoment, fcMethodMock, calendarServiceMock, initController,
    miniCalendarServiceMock, calendarEventSourceMock, UI_CONFIG_MOCK, calendar, uiCalendarConfigMock,
    calendarCurrentViewMock, CALENDAR_EVENTS, cachedEventSourceMock, uniqueId, uuid4Mock, calWrapper;

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

    calendarServiceMock = {
      listCalendars: function(userId) {
        expect(userId).to.equals($scope.calendarHomeId);
        var deferred = $q.defer();
        deferred.resolve([{
          href: 'href',
          id: 'id'
        }]);
        return deferred.promise;
      }
    };

    cachedEventSourceMock = {
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
      removeEvent: sinon.spy(),
      rerender: sinon.spy()
    };

    miniCalendarServiceMock.miniCalendarWrapper = sinon.stub().returns(calWrapper);

    angular.mock.module(function($provide) {
      $provide.value('calendarService', calendarServiceMock);
      $provide.value('calendarEventSource', calendarEventSourceMock);
      $provide.value('uiCalendarConfig', uiCalendarConfigMock);
      $provide.value('miniCalendarService', miniCalendarServiceMock);
      $provide.value('cachedEventSource', cachedEventSourceMock);
      $provide.value('calendarCurrentView', calendarCurrentViewMock);
      $provide.value('uuid4', uuid4Mock);
      $provide.constant('UI_CONFIG', UI_CONFIG_MOCK);
    });

  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _fcMoment_, _$q_, _$window_, _CALENDAR_EVENTS_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    fcMoment = _fcMoment_;
    $q = _$q_;
    $window = _$window_;
    CALENDAR_EVENTS = _CALENDAR_EVENTS_;
    $scope.calendarHomeId = 'userId';
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

    it('should wrap calendars inside cachedEventSource.wrapEventSource', function() {
      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();
      expect(cachedEventSourceMock.wrapEventSource).to.have.been.calledWith('id', ['anEventSource']);
    });

    function testRerender(nameOfEvent) {
      return function() {
        var event = {id: 'anId', start: fcMoment()};

        calWrapper.modifyEvent = sinon.spy();
        $scope.miniCalendarConfig.viewRender();
        $rootScope.$broadcast(CALENDAR_EVENTS[nameOfEvent], event);
        $scope.$digest();
        expect(calWrapper.rerender).to.have.been.calledOnce;
      };
    }

    it('should call calWrapper.rerender on modifiedCalendarItem', testRerender('ITEM_MODIFICATION'));

    it('should call calWrapper.rerender on revertedCalendarItemModification', testRerender('REVERT_MODIFICATION'));

    it('should call calWrapper.rerender on CALENDAR_EVENTS.ITEM_REMOVE', testRerender('ITEM_MODIFICATION'));

    it('should call calWrapper.rerender on CALENDAR_EVENTS.ITEM_ADD', testRerender('ITEM_ADD'));
  });
});
