(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calendarViewController', calendarViewController);

  calendarViewController.$inject = [
    '$alert',
    '$q',
    '$rootScope',
    '$scope',
    '$state',
    '$timeout',
    '$window',
    'usSpinnerService',
    'cachedEventSource',
    'calendarCurrentView',
    'calendarEventSource',
    'calendarService',
    'CalendarShell',
    'calendarVisibilityService',
    'eventService',
    'masterEventCache',
    'calendarEventEmitter',
    'calendarUtils',
    'eventUtils',
    'gracePeriodService',
    'livenotification',
    'notificationFactory',
    'openEventForm',
    'CALENDAR_EVENTS',
    'DEFAULT_CALENDAR_ID',
    'MAX_CALENDAR_RESIZE_HEIGHT',
    'esnWithPromiseResult'
  ];

  function calendarViewController(
    $alert,
    $q,
    $rootScope,
    $scope,
    $state,
    $timeout,
    $window,
    usSpinnerService,
    cachedEventSource,
    calendarCurrentView,
    calendarEventSource,
    calendarService,
    CalendarShell,
    calendarVisibilityService,
    eventService,
    masterEventCache,
    calendarEventEmitter,
    calendarUtils,
    eventUtils,
    gracePeriodService,
    livenotification,
    notificationFactory,
    openEventForm,
    CALENDAR_EVENTS,
    DEFAULT_CALENDAR_ID,
    MAX_CALENDAR_RESIZE_HEIGHT,
    esnWithPromiseResult) {

      var windowJQuery = angular.element($window);
      var calendarDeffered = $q.defer();
      var calendarPromise = calendarDeffered.promise;
      var spinnerKey = 'calendar';

      $scope.eventSourcesMap = {};
      $scope.eventSources = [];
      $scope.$state = $state;
      $scope.eventClick = eventClick;
      $scope.eventDropAndResize = eventDropAndResize;
      $scope.eventRender = eventUtils.render;
      $scope.displayCalendarError = displayCalendarError;
      $scope.resizeCalendarHeight = withCalendar(function(calendar) {
        var height = windowJQuery.height() - calendar.offset().top;

        height = height > MAX_CALENDAR_RESIZE_HEIGHT ? MAX_CALENDAR_RESIZE_HEIGHT : height;
        calendar.fullCalendar('option', 'height', height);
        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDAR_HEIGHT, height);
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
      $scope.calendarReady = calendarDeffered.resolve.bind(calendarDeffered);

      activate();

      ////////////
      function withCalendar(successCallback, errorCallback) {
        return esnWithPromiseResult(calendarPromise, successCallback, errorCallback);
      }

      function activate() {
        calendarService.calendarHomeId = $scope.calendarHomeId;
        calendarService.listCalendars($scope.calendarHomeId)
          .then(function(calendars) {
            $scope.calendars = calendars || [];
            $scope.calendars.forEach(function(calendar) {
              $scope.eventSourcesMap[calendar.href] = {
                events: cachedEventSource.wrapEventSource(calendar.id, calendarEventSource(calendar.href, $scope.displayCalendarError)),
                backgroundColor: calendar.color
              };

              if (!calendarVisibilityService.isHidden(calendar)) {
                calendarPromise.then(function(cal) {
                  cal.fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.href]);
                });
              }
            });
          })
          .catch($scope.displayCalendarError);

        windowJQuery.resize($scope.resizeCalendarHeight);
        $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);
      }

      function eventClick(event) {
        openEventForm(event.clone());
      }

      function eventDropAndResize(drop, event, delta, revert) {
        var newEvent = event.clone();

        newEvent.start = event.start;
        newEvent.end = event.end;
        newEvent.path = newEvent.path || '/calendars/' + $scope.calendarHomeId + '/' + DEFAULT_CALENDAR_ID;

        var oldEvent = newEvent.clone();

        if (drop) {
          oldEvent.start.subtract(delta);
        }
        oldEvent.end.subtract(delta);
        function revertFunc() {
          revert();
          $rootScope.$broadcast(CALENDAR_EVENTS.REVERT_MODIFICATION, oldEvent);
        }

        eventService.modifyEvent(newEvent.path, newEvent, oldEvent, newEvent.etag, revertFunc, { graceperiod: true, notifyFullcalendar: true })
          .then(function(completed) {
            if (completed) {
              notificationFactory.weakInfo('Calendar - ', newEvent.title + ' has been modified.');
            } else {
              notificationFactory.weakInfo('Calendar - ', 'Modification of ' + newEvent.title + ' has been cancelled.');
            }
          });
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
        $rootScope.$broadcast(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, view);
      }

      function select(start, end) {
        var date = calendarUtils.getDateOnCalendarSelect(start, end);
        var event = CalendarShell.fromIncompleteShell({
          start: date.start,
          end: date.end
        });

        openEventForm(event);
      }

      function loading(isLoading) {
        if (isLoading) {
          usSpinnerService.spin(spinnerKey);
          $scope.hideCalendar = true;
        } else {
          usSpinnerService.stop(spinnerKey);
          $scope.hideCalendar = false;
        }
      }

      var miniCalendarHidden = true;
      var unregisterFunctions = [
        $rootScope.$on(CALENDAR_EVENTS.ITEM_MODIFICATION, _rerenderCalendar),
        $rootScope.$on(CALENDAR_EVENTS.ITEM_REMOVE, _rerenderCalendar),
        $rootScope.$on(CALENDAR_EVENTS.ITEM_ADD, _rerenderCalendar),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TODAY, withCalendar(function(calendar) {
          calendar.fullCalendar('today');
        })),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, withCalendar(function(calendar, event, viewType) {
          calendar.fullCalendar('changeView', viewType);
        })),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, withCalendar(function(calendar, event, data) { // eslint-disable-line
          if (data.hidden) {
            calendar.fullCalendar('removeEventSource', $scope.eventSourcesMap[data.calendar.href]);
          } else {
            calendar.fullCalendar('addEventSource', $scope.eventSourcesMap[data.calendar.href]);
          }
        })),
        $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, withCalendar(function(calendar, event, newDate) { // eslint-disable-line
          var view = calendar.fullCalendar('getView');

          if (newDate && !newDate.isBetween(view.start, view.end)) {
            calendar.fullCalendar('gotoDate', newDate);
          }
        })),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.ADD, function(event, calendar) { // eslint-disable-line
          $scope.calendars.push(calendar);
        }),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.UPDATE, function(event, calendar) { // eslint-disable-line
          $scope.calendars.forEach(function(cal, index) {
            if (calendar.id === cal.id) {
              $scope.calendars[index] = calendar;
            }
          });
        }),
        $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, function() {
          miniCalendarHidden = !miniCalendarHidden;
        }),
        $rootScope.$on(CALENDAR_EVENTS.VIEW_TRANSLATION, function(event, action) { // eslint-disable-line
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

      var sio = livenotification('/calendars');

      sio.on(CALENDAR_EVENTS.WS.EVENT_CREATED, _liveNotificationHandlerOnCreateRequestandUpdate);
      sio.on(CALENDAR_EVENTS.WS.EVENT_REQUEST, _liveNotificationHandlerOnCreateRequestandUpdate);
      sio.on(CALENDAR_EVENTS.WS.EVENT_CANCEL, _liveNotificationHandlerOnDelete);
      sio.on(CALENDAR_EVENTS.WS.EVENT_UPDATED, _liveNotificationHandlerOnCreateRequestandUpdate);
      sio.on(CALENDAR_EVENTS.WS.EVENT_DELETED, _liveNotificationHandlerOnDelete);
      sio.on(CALENDAR_EVENTS.WS.EVENT_REPLY, _liveNotificationHandlerOnCreateRequestandUpdate);

      $scope.$on('$destroy', function() {
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CREATED, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_UPDATED, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_DELETED, _liveNotificationHandlerOnDelete);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REQUEST, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REPLY, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CANCEL, _liveNotificationHandlerOnDelete);
        unregisterFunctions.forEach(function(unregisterFunction) {
          unregisterFunction();
        });
        gracePeriodService.flushAllTasks();
        cachedEventSource.resetCache();
        windowJQuery.off('resize', $scope.resizeCalendarHeight);
      });

      function _liveNotificationHandlerOnCreateRequestandUpdate(msg) {
        var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        cachedEventSource.registerUpdate(event);
        masterEventCache.save(event);
        calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
      }

      function _liveNotificationHandlerOnDelete(msg) {
        var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        cachedEventSource.registerDelete(event);
        masterEventCache.remove(event);
        calendarEventEmitter.fullcalendar.emitRemovedEvent(event);
      }
  }
})();
