'use strict';

/* global _:false */

angular.module('esn.calendar')
  .controller('miniCalendarController', function($rootScope, $q, $timeout, $window, $scope, $log, fcMoment, USER_UI_CONFIG,
    uiCalendarConfig, session, calendarEventSource, calendarService, miniCalendarLogic, notificationFactory, calendarCurrentView) {

    var calendarDeffered = $q.defer();
    var calendarPromise = calendarDeffered.promise;
    var userId = session.user._id;

    $scope.miniCalendarConfig = angular.extend({}, USER_UI_CONFIG.calendar,
      USER_UI_CONFIG.miniCalendar);
    $scope.miniCalendarId = userId + 'MiniCalendar';
    $scope.events = [];

    var currentView = calendarCurrentView.get();
    $scope.homeCalendarViewMode = currentView.name || USER_UI_CONFIG.calendar.defaultView;

    function selectPeriod(day, calendar) {
      day = fcMoment(day).stripTime();
      calendar.fullCalendar('gotoDate', day);
      switch ($scope.homeCalendarViewMode) {
        case 'agendaWeek':
          var week = miniCalendarLogic.getWeekAroundDay($scope.miniCalendarConfig, day);
          calendar.fullCalendar('select', week.firstWeekDay, week.nextFirstWeekDay);
          break;
        case 'agendaDay':
          var nextDay = fcMoment(day).add(1, 'days');
          calendar.fullCalendar('select', day, nextDay);
          break;
        case 'month':
          calendar.fullCalendar('unselect');
          break;
        default:
          throw 'unknown view mode : ' + $scope.homeCalendarViewMode;
      }
    }

    calendarPromise.then(selectPeriod.bind(null, currentView.start || fcMoment()));

    $scope.miniCalendarConfig.select = function(start, end, jsEvent, view) {
      if (jsEvent) {
        calendarPromise.then(selectPeriod.bind(null, start));
        $rootScope.$broadcast('MINI_CALENDAR_DATE_CHANGE', start);
      }
    };

    function windowResize() {
      uiCalendarConfig.calendars[$scope.miniCalendarId].fullCalendar('render');
    }

    var windowJQuery = angular.element($window);

    //otherwise if when the directive is initialized hidden
    //when the window is enlarger and the mini-calendar appear
    //the calendar is not render
    windowJQuery.on('resize.miniCalendarResize', windowResize);

    function unregisterWindowResize() {
      windowJQuery.off('resize.miniCalendarResize');
    }

    var calendarResolved = false;
    $scope.miniCalendarConfig.viewRender = function() {
      if (!calendarResolved) {
        calendarDeffered.resolve(uiCalendarConfig.calendars[$scope.miniCalendarId]);
        unregisterWindowResize();
        calendarResolved = true;
      }
    };

    $scope.miniCalendarConfig.eventClick = function(event) {
      $rootScope.$broadcast('MINI_CALENDAR_DATE_CHANGE', event.start);
    };

    var calendarWrapperPromise = $q.all({
      calendar: calendarPromise,
      calendars: calendarService.listCalendars(userId)
    }).then(function(resolved) {
      var eventSources = resolved.calendars.map(function(cal) {
        return calendarEventSource(cal.getHref(), function(error) {
          notificationFactory.weakError('Could not retrieve event sources', error.message);
          $log.error('Could not retrieve event sources', error);
        });
      });

      return miniCalendarLogic.miniCalendarWrapper(resolved.calendar, _.flatten(eventSources));

    }, function(error) {
      notificationFactory.weakError('Could not retrive user calendars', error.message);
      $log.error('Could not retrieve user calendars', error);
    });

    function bindEventToCalWrapperMethod(angularEventName, calWrapperMethod) {
      return $rootScope.$on(angularEventName, function(angularEvent, data) {
        calendarWrapperPromise.then(function(calendarWrapper) {
          calendarWrapper[calWrapperMethod](data);
        });
      });
    }

    var unregisterFunctions = [
      bindEventToCalWrapperMethod('addedCalendarItem', 'addEvent'),
      bindEventToCalWrapperMethod('removedCalendarItem', 'removeEvent'),
      bindEventToCalWrapperMethod('modifiedCalendarItem', 'modifyEvent'),
      bindEventToCalWrapperMethod('revertedCalendarItemModification', 'modifyEvent'),

      $rootScope.$on('HOME_CALENDAR_VIEW_CHANGE', function(event, view) {
        $scope.homeCalendarViewMode = view.name;
        var start = view.name === 'month' ? fcMoment(view.start).add(15, 'days') : view.start;
        calendarPromise.then(selectPeriod.bind(null, start));
      })
    ];

    $scope.$on('$destroy', function() {
      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });

      unregisterWindowResize();
    });
  });
