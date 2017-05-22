'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The mini-calendar controller', function() {

  var $scope, $rootScope, $controller, $q, calMoment, fcMethodMock, calendarServiceMock, initController,
    miniCalendarServiceMock, calendarEventSourceMock, UI_CONFIG_MOCK, calendar, calendarCurrentViewMock,
      CAL_EVENTS, calCachedEventSourceMock, calWrapper, element, event;

  function sameDayMatcher(day) {
    return function(_day) {
      return _day && _day.isSame(day, 'day');
    };
  }

  function Element() {
    this.class = [];
  }

  Element.prototype.addClass = function(aClass) {
    this.class.push(aClass);
  };

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');

    calendarServiceMock = {
      listCalendars: function(userId) {
        expect(userId).to.equals($scope.calendarHomeId);
        var deferred = $q.defer();

        deferred.resolve([{
          href: 'href',
          uniqueId: 'uniqueId'
        }]);

        return deferred.promise;
      }
    };

    calCachedEventSourceMock = {
      wrapEventSource: sinon.spy(function(id, source) { // eslint-disable-line
        return source;
      })
    };

    miniCalendarServiceMock = {
      getWeekAroundDay: sinon.stub().returns({firstWeekDay: null, nextFirstWeekDay: null}),
      miniCalendarWrapper: angular.identity
    };

    calendarEventSourceMock = {};

    calendarCurrentViewMock = {
      set: sinon.spy(),
      getMiniCalendarView: sinon.stub().returns({}),
      setMiniCalendarView: sinon.spy(),
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
      $provide.value('miniCalendarService', miniCalendarServiceMock);
      $provide.value('calCachedEventSource', calCachedEventSourceMock);
      $provide.value('calendarCurrentView', calendarCurrentViewMock);
      $provide.constant('CAL_UI_CONFIG', UI_CONFIG_MOCK);
    });

  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _calMoment_, _$q_, _CAL_EVENTS_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    calMoment = _calMoment_;
    $q = _$q_;
    CAL_EVENTS = _CAL_EVENTS_;
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

  it('should change view on VIEW_TRANSLATION only when mobile mini calendar is displayed', function() {
    initController();
    ['prev', 'next'].forEach(function(action) {
      $scope.calendarReady(calendar);

      $rootScope.$broadcast(CAL_EVENTS.VIEW_TRANSLATION, action);

      $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      $rootScope.$broadcast(CAL_EVENTS.VIEW_TRANSLATION, action);

      $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      $rootScope.$broadcast(CAL_EVENTS.VIEW_TRANSLATION, action);

      $rootScope.$digest();
      expect(fcMethodMock[action]).to.have.been.calledOnce;
    });
  });

  it('should call fullCalendar next on swipeRight', function() {
    initController();
    $scope.calendarReady(calendar);
    $scope.swipeRight();
    $scope.$digest();
    expect(fcMethodMock.prev).to.have.been.calledOnce;
  });

  it('should call fullCalendar next on swipeLeft', function() {
    initController();
    $scope.calendarReady(calendar);
    $scope.swipeLeft();
    $scope.$digest();
    expect(fcMethodMock.next).to.have.been.calledOnce;
  });

  describe('The selection of period in the mini calendar', function() {

    var firstWeekDay, dayInWeek, lastWeekDay;

    beforeEach(function() {
      firstWeekDay = calMoment('2015-11-30');
      dayInWeek = calMoment('2015-12-04');
      lastWeekDay = calMoment('2015-12-07');
      initController();
    });

    it('should select and go to the current view when initializing the mini calendar', function() {
      var day = calMoment('1940-03-10');

      calendarCurrentViewMock.get = sinon.stub().returns({
        name: 'agendaDay',
        start: day
      });

      initController();

      $scope.calendarReady(calendar);
      $scope.$digest();

      expect(fcMethodMock.gotoDate).to.have.been.calledWith(sinon.match(sameDayMatcher(day)));

      expect(fcMethodMock.select).to.have.been.called;
      expect(calendarCurrentViewMock.get).to.have.been.called;
      expect($scope.homeCalendarViewMode).to.equals('agendaDay');
    });

    it('should broadcast CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE when a day is selected', function(done) {
      var day = calMoment();

      $scope.calendarReady(calendar);

      var unregister = $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, function(event, _day) { // eslint-disable-line
        expect(day.isSame(_day, 'day')).to.be.true;
        unregister();
        done();
      });

      $scope.miniCalendarConfig.dayClick(day);
    });

    it('should broadcast CAL_EVENTS.MINI_CALENDAR.TOGGLE when a day is selected', function(done) {
      var day = calMoment();

      $scope.calendarReady(calendar);

      var unregister = $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.TOGGLE, function() {
        unregister();
        done();
      });

      $scope.miniCalendarConfig.dayClick(day);
    });

    it('should broadcast CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, when a event is clicked, the day sent with this event should be the day where the event is', function(done) {
      var day = calMoment();

      $scope.calendarReady(calendar);

      var unregister = $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, function(event, _day) { // eslint-disable-line
        expect(day.isSame(_day, 'day')).to.be.true;
        unregister();
        done();
      });

      $scope.miniCalendarConfig.eventClick({start: day});
    });

    it('should broadcast CAL_EVENTS.MINI_CALENDAR.TOGGLE, when a event is clicked', function(done) {
      var day = calMoment();

      $scope.calendarReady(calendar);

      var unregister = $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.TOGGLE, function() {
        unregister();
        done();
      });

      $scope.miniCalendarConfig.eventClick({start: day});
    });

    it('should select the good period on CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE event with day as viewMode', function(done) {
      var day = calMoment().stripTime();

      $scope.calendarReady(calendar);
      $scope.$digest();

      fcMethodMock.select = function(start, end) {
        expect(day.isSame(start, 'days')).to.be.true;
        day.add(1, 'days');
        expect(day.isSame(end, 'days')).to.be.true;
        done();
      };

      $rootScope.$broadcast(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'agendaDay', start: day});
      $scope.$digest();
    });

    it('should select the good period on CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE event with three days as viewMode', function(done) {
      var day = calMoment().stripTime();

      $scope.calendarReady(calendar);
      $scope.$digest();

      fcMethodMock.select = function(start, end) {
        expect(day.isSame(start, 'days')).to.be.true;
        day.add(3, 'days');
        expect(day.isSame(end, 'days')).to.be.true;
        done();
      };

      $rootScope.$broadcast(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'agendaThreeDays', start: day});
      $scope.$digest();
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in day view', function() {
      $scope.calendarReady(calendar);
      $scope.$digest();
      var day = calMoment().stripTime();

      $scope.homeCalendarViewMode = 'agendaDay';

      $scope.miniCalendarConfig.dayClick(day);
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(day)), sinon.match(sameDayMatcher(day.clone().add(1, 'day'))));
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in week view', function() {
      $scope.homeCalendarViewMode = 'agendaWeek';
      $scope.calendarReady(calendar);
      $scope.$digest();

      miniCalendarServiceMock.getWeekAroundDay = sinon.spy(function(config, day) {
        expect(config).to.equals($scope.miniCalendarConfig);
        expect(day.isSame(dayInWeek, 'day')).to.be.true;

        return {firstWeekDay: firstWeekDay, nextFirstWeekDay: lastWeekDay};
      });

      $scope.miniCalendarConfig.dayClick(dayInWeek);
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(firstWeekDay)), sinon.match(sameDayMatcher(lastWeekDay)));
      expect(miniCalendarServiceMock.getWeekAroundDay).to.have.been.called;
    });

    it('should select the good period on CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE with week as view mode', function() {
      $scope.calendarReady(calendar);
      $scope.$digest();

      miniCalendarServiceMock.getWeekAroundDay = sinon.stub().returns({firstWeekDay: firstWeekDay, nextFirstWeekDay: lastWeekDay});

      $rootScope.$broadcast(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'agendaWeek', start: dayInWeek});
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(firstWeekDay)), sinon.match(sameDayMatcher(lastWeekDay)));
      expect(miniCalendarServiceMock.getWeekAroundDay).to.have.been.calledWith($scope.miniCalendarConfig, sinon.match(sameDayMatcher(dayInWeek)));
    });

    it('should unselect on CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE with month as view mode', function() {
      $scope.calendarReady(calendar);

      $rootScope.$broadcast(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'month', start: null});
      $scope.$digest();
      expect(fcMethodMock.unselect).to.have.been.called;
    });

    it('should select the good period on CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE event with planning as viewMode', function() {
      var day = calMoment().stripTime();

      $scope.calendarReady(calendar);
      $scope.$digest();

      fcMethodMock.select = sinon.spy();

      $rootScope.$broadcast(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, {name: 'basicDay', start: day});
      $scope.$digest();
      expect(fcMethodMock.select).to.have.been.calledWith(sinon.match(sameDayMatcher(day)), sinon.match(sameDayMatcher(day.clone().add(1, 'day'))));
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in month view', function() {
      $scope.calendarReady(calendar);
      var day = calMoment();

      $scope.homeCalendarViewMode = 'month';

      $scope.miniCalendarConfig.dayClick(day);
      $scope.$digest();
      expect(fcMethodMock.unselect).to.have.been.called;
    });

  });

  describe('the synchronization of events between the home calendar and the mini calendar', function() {

    beforeEach(function() {
      initController();
    });

    it('should wrap calendars inside a miniCalendarWrapper', function() {
      $scope.calendarReady(calendar);
      $scope.$digest();
      expect(miniCalendarServiceMock.miniCalendarWrapper).to.have.been.calledWith(calendar, ['anEventSource']);
    });

    it('should wrap calendars inside calCachedEventSource.wrapEventSource', function() {
      $scope.calendarReady(calendar);
      $scope.$digest();
      expect(calCachedEventSourceMock.wrapEventSource).to.have.been.calledWith('uniqueId', ['anEventSource']);
    });

    function testRerender(nameOfEvent) {
      return function() {
        var event = {id: 'anId', start: calMoment()};

        $scope.calendarReady(calendar);
        $rootScope.$broadcast(CAL_EVENTS[nameOfEvent], event);
        $scope.$digest();
        expect(calWrapper.rerender).to.have.been.calledOnce;
      };
    }

    it('should call calWrapper.rerender on modifiedCalendarItem', testRerender('ITEM_MODIFICATION'));

    it('should call calWrapper.rerender on calendar refresh', testRerender('CALENDAR_REFRESH'));

    it('should call calWrapper.rerender on revertedCalendarItemModification', testRerender('REVERT_MODIFICATION'));

    it('should call calWrapper.rerender on CAL_EVENTS.ITEM_REMOVE', testRerender('ITEM_MODIFICATION'));

    it('should call calWrapper.rerender on CAL_EVENTS.ITEM_ADD', testRerender('ITEM_ADD'));
  });

  describe('the eventRender function', function() {

    it('should change the dot color when the current day is the same then the event day', function() {
      element = new Element();
      event = {
        start: calMoment()
      };

      initController();

      $scope.miniCalendarConfig.eventRender(event, element);

      expect(element.class).to.include('fc-event-color');
    });

    it('should not change the dot color when the current day and the event day are different', function() {
      element = new Element();
      event = {
        start: calMoment('2016-08-29')
      };

      initController();

      $scope.miniCalendarConfig.eventRender(event, element);

      expect(element.class).to.not.include('fc-event-color');
    });
  });
});
