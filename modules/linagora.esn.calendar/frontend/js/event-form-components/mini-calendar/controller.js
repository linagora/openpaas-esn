'use strict';

/* global _:false */

angular.module('esn.calendar')
  .controller('miniCalendarController', function($rootScope, $q, $timeout, $window, $scope, $log, fcMoment, USER_UI_CONFIG,
    uiCalendarConfig, session, calendarEventSource, calendarService, miniCalendarLogic, notificationFactory, calendarCurrentView) {

    var calendar;
    var userId = session.user._id;

    $scope.miniCalendarConfig = angular.extend({}, USER_UI_CONFIG.calendar,
      USER_UI_CONFIG.miniCalendar);
    $scope.miniCalendarId = userId + 'MiniCalendar';
    $scope.events = [];

    var currentView = calendarCurrentView.get();
    $scope.homeCalendarViewMode = currentView.name || USER_UI_CONFIG.calendar.defaultView;

    function selectPeriod(day) {
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

    $scope.miniCalendarConfig.select = function(start, end, jsEvent, view) {
      if (jsEvent) {
        selectPeriod(start);
        $rootScope.$broadcast('MINI_CALENDAR_DATE_CHANGE', start);
      }
    };

    function windowResize() {
      uiCalendarConfig.calendars[$scope.calendarLeftId].fullCalendar('render');
    }

    var windowJQuery = angular.element($window);

    //otherwise if when the directive is initialized hidden
    //when the window is enlarger and the mini-calendar appear
    //the calendar is not render
    windowJQuery.on('resize.miniCalendarResize', windowResize);

    function unregisterWindowResize() {
      windowJQuery.off('resize.miniCalendarResize');
    }

    var calendarWrapper;

    $scope.miniCalendarConfig.viewRender = function() {
      var eventSources = [];
      if (!calendar) {
        calendar = uiCalendarConfig.calendars[$scope.miniCalendarId];
        selectPeriod(currentView.start || fcMoment());

        calendarService.listCalendars(userId).then(function(calendars) {
          calendars.forEach(function(cal) {
            eventSources.push(calendarEventSource(cal.getHref(), function(error) {
              notificationFactory.weakError('Could not retrieve event sources', error.message);
              $log.error('Could not retrieve event sources', error);
            }));
          }, function(error) {
            notificationFactory.weakError('Could not retrieve user calendars', error.message);
            $log.error('Could not retrieve user calendars', error);
          });

          calendarWrapper = miniCalendarLogic.miniCalendarWrapper(calendar, _.flatten(eventSources));
        });

        unregisterWindowResize();
      }
    };

    $scope.miniCalendarConfig.eventClick = function(event) {
      $rootScope.$broadcast('MINI_CALENDAR_DATE_CHANGE', event.start);
    };

    var unregisterFunctions = [
      $rootScope.$on('addedCalendarItem', function(angularEvent, event) {
        calendarWrapper.addEvent(event);
      }),

      $rootScope.$on('removedCalendarItem', function(angularEvent, eventId) {
        calendarWrapper.removeEvent(eventId);
      }),

      $rootScope.$on('modifiedCalendarItem', function(angularEvent, event) {
        calendarWrapper.modifyEvent(event);
      }),

      $rootScope.$on('revertedCalendarItemModification', function(angularEvent, event) {
        calendarWrapper.modifyEvent(event);
      }),

      $rootScope.$on('HOME_CALENDAR_VIEW_CHANGE', function(event, view) {
        $scope.homeCalendarViewMode = view.name;
        selectPeriod(view.name === 'month' ? fcMoment(view.start).add(15, 'days') : view.start);
      })
    ];

    $scope.$on('$destroy', function() {
      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });

      unregisterWindowResize();
    });
  });
