(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calendarViewController', calendarViewController);

  function calendarViewController(
    $alert,
    $q,
    $rootScope,
    $scope,
    $state,
    $timeout,
    $window,
    _,
    usSpinnerService,
    calCachedEventSource,
    calendarCurrentView,
    calendarEventSource,
    calendarService,
    CalendarShell,
    calendarVisibilityService,
    calEventService,
    calendarUtils,
    calEventUtils,
    calWebsocketListenerService,
    gracePeriodService,
    calOpenEventForm,
    elementScrollService,
    esnWithPromiseResult,
    CAL_EVENTS,
    CAL_DEFAULT_CALENDAR_ID,
    CAL_MAX_CALENDAR_RESIZE_HEIGHT,
    CAL_SPINNER_TIMEOUT_DURATION
  ) {
      var windowJQuery = angular.element($window);
      var calendarDeffered = $q.defer();
      var calendarPromise = calendarDeffered.promise;
      var spinnerKey = 'calendar';
      var spinnerTimeoutPromise;

      elementScrollService.scrollToTop();

      $scope.eventSourcesMap = {};
      $scope.eventSources = [];
      $scope.$state = $state;
      $scope.eventClick = eventClick;
      $scope.eventDropAndResize = eventDropAndResize;
      $scope.uiConfig.calendar.eventRender = calEventUtils.render;
      $scope.displayCalendarError = displayCalendarError;
      $scope.resizeCalendarHeight = withCalendar(function(calendar) {
        var height = windowJQuery.height() - calendar.offset().top;

        height = height > CAL_MAX_CALENDAR_RESIZE_HEIGHT ? CAL_MAX_CALENDAR_RESIZE_HEIGHT : height;
        calendar.fullCalendar('option', 'height', height);
        $rootScope.$broadcast(CAL_EVENTS.CALENDAR_HEIGHT, height);
      });

      var prev = withCalendar(function(cal) {
        cal.fullCalendar('prev');
      });

      var next = withCalendar(function(cal) {
        cal.fullCalendar('next');
      });

      $scope.swipeLeft = next;
      $scope.swipeRight = prev;

      var currentView = calendarCurrentView.get();

      $scope.uiConfig.calendar.defaultDate = currentView.start || $scope.uiConfig.calendar.defaultDate;
      $scope.uiConfig.calendar.defaultView = currentView.name || $scope.uiConfig.calendar.defaultView;

      /*
       * "eventAfterAllRender" is called when all events are fetched but it
       * is not called when the davserver is unreachable so the "viewRender"
       * event is used to set the correct height but the event is called too
       * early and the calendar offset is wrong so wait with a timeout.
       */
      $scope.uiConfig.calendar.eventAfterAllRender = $scope.resizeCalendarHeight;
      $scope.uiConfig.calendar.viewRender = viewRender;
      $scope.uiConfig.calendar.eventClick = $scope.eventClick;
      $scope.uiConfig.calendar.eventResize = $scope.eventDropAndResize.bind(null, false);
      $scope.uiConfig.calendar.eventDrop = $scope.eventDropAndResize.bind(null, true);
      $scope.uiConfig.calendar.select = select;
      $scope.uiConfig.calendar.loading = loading;
      $scope.uiConfig.calendar.nextDayThreshold = '00:00';
      $scope.calendarReady = calendarDeffered.resolve.bind(calendarDeffered);

      activate();

      ////////////
      function withCalendar(successCallback, errorCallback) {
        return esnWithPromiseResult(calendarPromise, successCallback, errorCallback);
      }

      function activate() {
        calendarService.listCalendars($scope.calendarHomeId)
          .then(function(calendars) {
            $scope.calendars = calendars || [];
            $scope.calendars.forEach(function(calendar) {
              $scope.eventSourcesMap[calendar.uniqueId] = {
                events: calCachedEventSource.wrapEventSource(calendar.uniqueId, calendarEventSource(calendar, $scope.displayCalendarError)),
                backgroundColor: calendar.color
              };

              calendarVisibilityService.isHidden(calendar).then(function(calIsHidden) {
                if (!calIsHidden) {
                  calendarPromise.then(function(cal) {
                    cal.fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.uniqueId]);
                  });
                }
              });
            });
          })
          .catch($scope.displayCalendarError);

        windowJQuery.resize($scope.resizeCalendarHeight);
        $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);
      }

      function eventClick(event) {
        calOpenEventForm($scope.calendarHomeId, event.clone());
      }

      function eventDropAndResize(drop, event, delta, revert) {
        var newEvent = event.clone();

        newEvent.start = event.start;
        newEvent.end = event.end;
        newEvent.path = newEvent.path || '/calendars/' + $scope.calendarHomeId + '/' + CAL_DEFAULT_CALENDAR_ID;

        var oldEvent = newEvent.clone();

        if (drop) {
          oldEvent.start.subtract(delta);
        }
        oldEvent.end.subtract(delta);
        function revertFunc() {
          revert();
          $rootScope.$broadcast(CAL_EVENTS.REVERT_MODIFICATION, oldEvent);
        }

        calEventService.modifyEvent(newEvent.path, newEvent, oldEvent, newEvent.etag, revertFunc, { graceperiod: true, notifyFullcalendar: true });
      }

      function displayCalendarError(err, errorMessage) {
        $alert({
          content: err && err.message || errorMessage,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: '.calendar-error-message',
          duration: '3',
          animation: 'am-flip-x'
        });
      }

      function viewRender(view) {
        $timeout($scope.resizeCalendarHeight, 1000);
        calendarCurrentView.set(view);
        $rootScope.$broadcast(CAL_EVENTS.HOME_CALENDAR_VIEW_CHANGE, view);
      }

      function select(start, end) {
        var date = calendarUtils.getDateOnCalendarSelect(start, end);
        var event = CalendarShell.fromIncompleteShell({
          start: date.start,
          end: date.end
        });

        calOpenEventForm($scope.calendarHomeId, event);
      }

      function loading(isLoading) {
        if (isLoading) {
          spinnerTimeoutPromise = $timeout(function() {
            usSpinnerService.spin(spinnerKey);
            $scope.hideCalendar = true;
          }, CAL_SPINNER_TIMEOUT_DURATION);
        } else {
          $timeout.cancel(spinnerTimeoutPromise);
          usSpinnerService.stop(spinnerKey);
          $scope.hideCalendar = false;
        }
      }

      var miniCalendarHidden = true;
      var unregisterFunctions = [
        $rootScope.$on(CAL_EVENTS.ITEM_MODIFICATION, _rerenderCalendar),
        $rootScope.$on(CAL_EVENTS.ITEM_REMOVE, _rerenderCalendar),
        $rootScope.$on(CAL_EVENTS.ITEM_ADD, _rerenderCalendar),
        $rootScope.$on(CAL_EVENTS.CALENDARS.TODAY, withCalendar(function(calendar) {
          calendar.fullCalendar('today');
        })),
        $rootScope.$on(CAL_EVENTS.CALENDAR_UNSELECT, withCalendar(function(calendar) {
          calendar.fullCalendar('unselect');
        })),
        $rootScope.$on(CAL_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, withCalendar(function(calendar, event, viewType) {
          calendar.fullCalendar('changeView', viewType);
        })),
        $rootScope.$on(CAL_EVENTS.CALENDARS.TOGGLE_VIEW, withCalendar(function(calendar, event, data) { // eslint-disable-line
          if (data.hidden) {
            calendar.fullCalendar('removeEventSource', $scope.eventSourcesMap[data.calendarUniqueId]);
          } else {
            calendar.fullCalendar('addEventSource', $scope.eventSourcesMap[data.calendarUniqueId]);
          }
        })),
        $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.DATE_CHANGE, withCalendar(function(calendar, event, newDate) { // eslint-disable-line
          var view = calendar.fullCalendar('getView');

          if (newDate && !newDate.isBetween(view.start, view.end)) {
            calendar.fullCalendar('gotoDate', newDate);
          }
        })),
        $rootScope.$on(CAL_EVENTS.CALENDARS.ADD, function(event, calendar) { // eslint-disable-line
          $scope.calendars.push(calendar);

          $scope.eventSourcesMap[calendar.uniqueId] = {
            events: calCachedEventSource.wrapEventSource(calendar.uniqueId, calendarEventSource(calendar, $scope.displayCalendarError)),
            backgroundColor: calendar.color
          };

          calendarPromise.then(function(cal) {
            cal.fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.uniqueId]);
          });
        }),
        $rootScope.$on(CAL_EVENTS.CALENDARS.REMOVE, function(event, calendar) { // eslint-disable-line
          _.remove($scope.calendars, {uniqueId: calendar.uniqueId});
          var removedEventSource = $scope.eventSourcesMap[calendar.uniqueId];

          delete $scope.eventSourcesMap[calendar.uniqueId];

          calendarPromise.then(function(cal) {
            cal.fullCalendar('removeEventSource', removedEventSource);
          });
        }),
        $rootScope.$on(CAL_EVENTS.CALENDARS.UPDATE, function(event, calendar) { // eslint-disable-line
          $scope.calendars.forEach(function(cal, index) {
            if (calendar.uniqueId === cal.uniqueId) {
              $scope.calendars[index] = calendar;
            }
          });
        }),
        $rootScope.$on(CAL_EVENTS.CALENDAR_REFRESH, _rerenderCalendar),
        $rootScope.$on(CAL_EVENTS.MINI_CALENDAR.TOGGLE, function() {
          miniCalendarHidden = !miniCalendarHidden;
        }),
        $rootScope.$on(CAL_EVENTS.VIEW_TRANSLATION, function(event, action) { // eslint-disable-line
          if (miniCalendarHidden) {
            (action === 'prev' ? prev : next)();
          }
        })
      ];

      function _rerenderCalendar() {
        calendarPromise.then(function(calendar) {
          calendar.fullCalendar('refetchEvents');
        });
      }

      var websocketListener = calWebsocketListenerService.listenEvents();

      $scope.$on('$destroy', function() {
        websocketListener.clean();
        unregisterFunctions.forEach(function(unregisterFunction) {
          unregisterFunction();
        });
        gracePeriodService.flushAllTasks();
        calCachedEventSource.resetCache();
        windowJQuery.off('resize', $scope.resizeCalendarHeight);
      });
  }
})();
