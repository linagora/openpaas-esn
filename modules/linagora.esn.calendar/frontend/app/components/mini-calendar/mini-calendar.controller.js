(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('miniCalendarController', miniCalendarController);

  function miniCalendarController(
    $rootScope,
    $q,
    $scope,
    $log,
    calMoment,
    CAL_UI_CONFIG,
    CAL_EVENTS,
    calendarEventSource,
    calendarService,
    miniCalendarService,
    notificationFactory,
    calendarCurrentView,
    calCachedEventSource,
    userAndExternalCalendars,
    _) {

      var calendarDeffered = $q.defer();
      var calendarPromise = calendarDeffered.promise;
      var currentView = calendarCurrentView.get();

      $scope.miniCalendarConfig = angular.extend({}, CAL_UI_CONFIG.calendar, CAL_UI_CONFIG.miniCalendar);
      $scope.events = [];
      $scope.homeCalendarViewMode = currentView.name || CAL_UI_CONFIG.calendar.defaultView;
      $scope.calendarReady = calendarDeffered.resolve.bind(calendarDeffered);

      var prev = calendarPromise.then.bind(calendarPromise, function(cal) {
        cal.fullCalendar('prev');
      });

      var next = calendarPromise.then.bind(calendarPromise, function(cal) {
        cal.fullCalendar('next');
      });

      $scope.swipeLeft = next;
      $scope.swipeRight = prev;

      function selectPeriod(_day, calendar) {
        var day = calMoment(_day).stripTime();

        calendar.fullCalendar('gotoDate', day);
        switch ($scope.homeCalendarViewMode) {
          case 'agendaWeek':
            var week = miniCalendarService.getWeekAroundDay($scope.miniCalendarConfig, day);

            calendar.fullCalendar('select', week.firstWeekDay, week.nextFirstWeekDay);
            break;
          case 'agendaDay':
            var nextDay = calMoment(day).add(1, 'days');

            calendar.fullCalendar('select', day, nextDay);
            break;
          case 'month':
            calendar.fullCalendar('unselect');
            break;
          case 'agendaThreeDays':
            var nextThreeDays = calMoment(day).add(3, 'days');

            calendar.fullCalendar('select', day, nextThreeDays);
            break;
          case 'basicDay':
            var nextPlanningDay = calMoment(day).add(1, 'days');

            calendar.fullCalendar('select', day, nextPlanningDay);
            break;
          default:
            throw new Error('unknown view mode : ' + $scope.homeCalendarViewMode);
        }
      }

      calendarPromise.then(selectPeriod.bind(null, currentView.start || calMoment()));

      //this is because of a fullCalendar bug about dayClick on touch that block swipe
      //https://github.com/fullcalendar/fullcalendar/issues/3332
      $scope.miniCalendarConfig.longPressDelay = 0;
      $scope.miniCalendarConfig.dayClick = function(day) { // eslint-disable-line
        calendarPromise.then(selectPeriod.bind(null, day));
        $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, day);
        $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      };

      $scope.miniCalendarConfig.viewRender = function(view) {
        calendarCurrentView.setMiniCalendarView(view);
        $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.VIEW_CHANGE, view);
      };

      $scope.miniCalendarConfig.eventClick = function(event) {
        $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, event.start);
        $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      };

      $scope.miniCalendarConfig.eventRender = function(event, element) {
        if (event.start.isSame(calMoment(), 'day')) {
          element.addClass('fc-event-color');
        }
      };

      var calendarWrapperPromise = $q.all({
        calendar: calendarPromise,
        calendars: getOwnCalendars()
      }).then(function(resolved) {
        var eventSources = resolved.calendars.map(function(cal) {
          var rawSource = calendarEventSource(cal, function(error) {
            notificationFactory.weakError('Could not retrieve event sources', error.message);
            $log.error('Could not retrieve event sources', error);
          });

          return calCachedEventSource.wrapEventSource(cal.uniqueId, rawSource);
        });

        return miniCalendarService.miniCalendarWrapper(resolved.calendar, _.flatten(eventSources));

      }, function(error) {
        notificationFactory.weakError('Could not retrive user calendars', error.message);
        $log.error('Could not retrieve user calendars', error);
      });

      function rerenderMiniCalendar() {
        calendarWrapperPromise.then(function(calendarWrapper) {
          calendarWrapper.rerender();
        });
      }

      function getOwnCalendars() {
        return calendarService.listCalendars($scope.calendarHomeId).then(function(calendars) {
          return userAndExternalCalendars(calendars).userCalendars || [];
        });
      }

      var miniCalendarDisplay = false;
      var unregisterFunctions = [
        $rootScope.$on(CAL_EVENTS.ITEM_ADD, rerenderMiniCalendar),
        $rootScope.$on(CAL_EVENTS.ITEM_REMOVE, rerenderMiniCalendar),
        $rootScope.$on(CAL_EVENTS.ITEM_MODIFICATION, rerenderMiniCalendar),
        $rootScope.$on(CAL_EVENTS.REVERT_MODIFICATION, rerenderMiniCalendar),
        $rootScope.$on(CAL_EVENTS.CALENDAR_REFRESH, rerenderMiniCalendar),
        $rootScope.$on(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, function(event, view) { // eslint-disable-line
          $scope.homeCalendarViewMode = view.name;
          var start = view.name === 'month' ? calMoment(view.start).add(15, 'days') : view.start;

          calendarPromise.then(selectPeriod.bind(null, start));
        }),
        $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.TOGGLE, function() {
          miniCalendarDisplay = !miniCalendarDisplay;
        }),
        $rootScope.$on(CAL_EVENTS.VIEW_TRANSLATION, function(event, action) { // eslint-disable-line
          if (miniCalendarDisplay) {
            (action === 'prev' ? prev : next)();
          }
        })
      ];

      $scope.$on('$destroy', function() {
        unregisterFunctions.forEach(function(unregisterFunction) {
          unregisterFunction();
        });
      });
    }
})();
