'use strict';
/* global chai: false */ /* global sinon: false */

var expect = chai.expect;

describe('The mini-calendar controller', function() {

  var $scope, fcMoment, $rootScope, $controller, initController, $q, $timeout, fcMethodMock, calendarServiceMock,
    sessionMock, miniCalendarLogicMock, calendarEventSourceMock, USER_UI_CONFIG_MOCK, calendar, uiCalendarConfigMock;

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
          getHref: function() {
            return 'href';
          }
        }]);
        return deferred.promise;
      }
    };

    miniCalendarLogicMock = {
      getWeekAroundDay: function() {
        return {firstWeekDay: null, nextFirstWeekDay: null};
      }
    };

    calendarEventSourceMock = {};

    fcMethodMock = {
      select: angular.noop,
      gotoDate: angular.noop
    };

    calendar = {
      fullCalendar: function(name) {
        return fcMethodMock[name].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    };

    uiCalendarConfigMock = {
      calendars: {
        userIdMiniCalendar: calendar
      }
    };

    calendarEventSourceMock = function(href) {
      expect(href).to.equals('href');
      return ['anEventSource'];
    };

    USER_UI_CONFIG_MOCK = {
      calendar: {
        defaultView: 'agendaDay'
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('session', sessionMock);
      $provide.value('calendarService', calendarServiceMock);
      $provide.value('calendarEventSource', calendarEventSourceMock);
      $provide.value('uiCalendarConfig', uiCalendarConfigMock);
      $provide.value('miniCalendarLogic', miniCalendarLogicMock);
      $provide.constant('USER_UI_CONFIG', USER_UI_CONFIG_MOCK);
    });

  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _fcMoment_, _$q_, _$timeout_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    fcMoment = _fcMoment_;
    $q = _$q_;
    $timeout = _$timeout_;
    initController = function() {
      $controller('miniCalendarController', {$scope: $scope});
    };
  }));

  afterEach(function() {
    $rootScope.$destroy();
  });

  describe('The selection of period in the mini calendar', function() {

    var firstWeekDay, dayInWeek, lastWeekDay;
    beforeEach(function() {
      firstWeekDay = fcMoment('2015-11-30');
      dayInWeek = fcMoment('2015-12-04');
      lastWeekDay = fcMoment('2015-12-07');
      initController();
    });

    it('should select and go to the current day when initializing the mini calendar', function() {
      fcMethodMock = {
        gotoDate: sinon.spy(function(date) {
          expect(date.isSame(fcMoment(), 'day')).to.be.true;
        }),
        select: sinon.spy()
      };

      $scope.miniCalendarConfig.viewRender();

      expect(fcMethodMock.gotoDate).to.have.been.called;
      expect(fcMethodMock.select).to.have.been.called;
    });

    it('should broadcast MINI_CALENDAR_DATE_CHANGE when a day is selected', function(done) {
      var day = fcMoment();

      $scope.miniCalendarConfig.viewRender();

      var unregister = $rootScope.$on('MINI_CALENDAR_DATE_CHANGE', function(_day) {
        expect(day.isSame(_day, 'day')).to.be.true;
        unregister();
        done();
      });

      $scope.miniCalendarConfig.select(day, null, true, null);
    });

    it('should broadcast MINI_CALENDAR_DATE_CHANGE, when a event is clicked, the day sent with this event should be the day where the event is', function(done) {
      var day = fcMoment();
      $scope.miniCalendarConfig.viewRender();

      var unregister = $rootScope.$on('MINI_CALENDAR_DATE_CHANGE', function(_day) {
        expect(day.isSame(_day, 'day')).to.be.true;
        unregister();
        done();
      });

      $scope.miniCalendarConfig.eventClick({start: day});
    });

    it('should select the good period on HOME_CALENDAR_VIEW_CHANGE event with day as viewMode', function(done) {
      var day = fcMoment();
      $scope.miniCalendarConfig.viewRender();

      fcMethodMock.select = function(start, end) {
        expect(day.isSame(start, 'days')).to.be.true;
        day.add(1, 'days');
        expect(day.isSame(end, 'days')).to.be.true;
        done();
      };

      $rootScope.$broadcast('HOME_CALENDAR_VIEW_CHANGE', {name: 'agendaDay', start: day});
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in day view', function() {
      $scope.miniCalendarConfig.viewRender();
      var day = fcMoment();

      $scope.homeCalendarViewMode = 'agendaDay';

      fcMethodMock.select = sinon.spy(function(start, end) {
        expect(day.isSame(start, 'day')).to.be.true;
        day.add(1, 'days');
        expect(day.isSame(end, 'day')).to.be.true;
      });

      $scope.miniCalendarConfig.select(day, null, true, null);

      expect(fcMethodMock.select).to.have.been.called;
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in week view', function() {
      $scope.homeCalendarViewMode = 'agendaWeek';
      $scope.miniCalendarConfig.viewRender();

      fcMethodMock.select = sinon.spy(function(start, end) {
        expect(start.isSame(firstWeekDay, 'day')).to.be.true;
        expect(end.isSame(lastWeekDay, 'day')).to.be.true;
      });

      miniCalendarLogicMock.getWeekAroundDay = sinon.spy(function(config, day) {
        expect(config).to.equals($scope.miniCalendarConfig);
        expect(day.isSame(dayInWeek, 'day')).to.be.true;
        return {firstWeekDay: firstWeekDay, nextFirstWeekDay: lastWeekDay};
      });

      $scope.miniCalendarConfig.select(dayInWeek, null, true, null);
      expect(fcMethodMock.select).to.have.been.called;
      expect(miniCalendarLogicMock.getWeekAroundDay).to.have.been.called;
    });

    it('should select the good period on HOME_CALENDAR_VIEW_CHANGE with week as view mode', function(done) {
      $scope.miniCalendarConfig.viewRender();

      fcMethodMock.select = sinon.spy(function(start, end) {
        expect(start.isSame(firstWeekDay, 'day')).to.be.true;
        expect(end.isSame(lastWeekDay, 'day')).to.be.true;
        expect(fcMethodMock.select).to.have.been.called;
        expect(miniCalendarLogicMock.getWeekAroundDay).to.have.been.called;
        done();
      });

      miniCalendarLogicMock.getWeekAroundDay = sinon.spy(function(config, day) {
        expect(config).to.equals($scope.miniCalendarConfig);
        expect(day.isSame(dayInWeek, 'day')).to.be.true;
        return {firstWeekDay: firstWeekDay, nextFirstWeekDay: lastWeekDay};
      });

      $rootScope.$broadcast('HOME_CALENDAR_VIEW_CHANGE', {name: 'agendaWeek', start: dayInWeek});
    });

    it('should unselect on HOME_CALENDAR_VIEW_CHANGE with month as view mode', function(done) {
      $scope.miniCalendarConfig.viewRender();

      fcMethodMock.unselect = function() {
        done();
      };

      $rootScope.$broadcast('HOME_CALENDAR_VIEW_CHANGE', {name: 'month', start: null});
    });

    it('should select the good period when user select a day in the small calendar and when the big calendar is in month view', function() {
      $scope.miniCalendarConfig.viewRender();
      var day = fcMoment();
      $scope.homeCalendarViewMode = 'month';

      fcMethodMock.unselect = sinon.spy();

      $scope.miniCalendarConfig.select(day, null, true, null);

      expect(fcMethodMock.unselect).to.have.been.called;
    });

  });

  describe('the synchronization of events between the home calendar and the mini calendar', function() {

    var calWrapper;

    beforeEach(function() {
      calWrapper = {};
      miniCalendarLogicMock.miniCalendarWrapper = function() {
        return calWrapper;
      };
      initController();
    });

    it('should  wrap the calendar inside a miniCalendarWrapper', function(done) {
      $scope.miniCalendarConfig.viewRender();

      miniCalendarLogicMock.miniCalendarWrapper = sinon.spy(function(_calendar, eventSources) {
        expect(eventSources).to.deep.equals(['anEventSource']);
        expect(_calendar).to.equals(calendar);
        done();
      });

      $scope.$digest();
    });

    it('should call calWrapper.addEvent on addedCalendarItem', function(done) {
      var event = {id: 'anId', start: fcMoment()};
      calWrapper.addEvent = function(_event) {
        expect(_event).to.equals(event);
        done();
      };

      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();
      $rootScope.$broadcast('addedCalendarItem', event);
    });

    it('should call calWrapper.deleteEvent on removedCalendarItem', function(done) {
      var id = 'anId';

      calWrapper.removeEvent = function(_id) {
        expect(_id).to.equals(id);
        done();
      };

      $scope.miniCalendarConfig.viewRender();
      $scope.$digest();
      $rootScope.$broadcast('removedCalendarItem', id);
    });

    function testModifyEvent(nameOfEvent) {
      return function(done) {
        var event = {id: 'anId', start: fcMoment()};

        calWrapper.modifyEvent = function(_event) {
          expect(_event).to.equals(event);
          done();
        };

        $scope.miniCalendarConfig.viewRender();
        $scope.$digest();
        $rootScope.$broadcast(nameOfEvent, event);
      };
    }

    it('should call calWrapper.modifyEvent on modifiedCalendarItem', testModifyEvent('modifiedCalendarItem'));

    it('should call calWrapper.modifyEvent on revertedCalendarItemModification', testModifyEvent('revertedCalendarItemModification'));

  });
});
