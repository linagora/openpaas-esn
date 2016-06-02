'use strict';

angular.module('esn.calendar')

  .controller('calendarController', function(
      $scope,
      $q,
      $rootScope,
      $window,
      $timeout,
      $log,
      $alert,
      $state,
      openEventForm,
      cachedEventSource,
      masterEventCache,
      CalendarShell,
      uiCalendarConfig,
      calendarService,
      calendarEventEmitter,
      calendarUtils,
      eventUtils,
      notificationFactory,
      calendarEventSource,
      livenotification,
      gracePeriodService,
      calendarCurrentView,
      calendarVisibilityService,
      CALENDAR_EVENTS,
      MAX_CALENDAR_RESIZE_HEIGHT,
      CALENDAR_DEDAULT_EVENT_COLOR,
      DEFAULT_CALENDAR_ID) {

    var windowJQuery = angular.element($window);

    $scope.$state = $state;

    var calendarDeffered = $q.defer();
    var calendarPromise = calendarDeffered.promise;

    $scope.resizeCalendarHeight = calendarPromise.then.bind(calendarPromise, function(calendar) {
      var height = windowJQuery.height() - calendar.offset().top;
      height = height > MAX_CALENDAR_RESIZE_HEIGHT ? MAX_CALENDAR_RESIZE_HEIGHT : height;
      calendar.fullCalendar('option', 'height', height);
      $rootScope.$broadcast(CALENDAR_EVENTS.CALENDAR_HEIGHT, height);
    });

    var prev = calendarPromise.then.bind(calendarPromise, function(cal) {
      cal.fullCalendar('prev');
    });

    var next  = calendarPromise.then.bind(calendarPromise, function(cal) {
      cal.fullCalendar('next');
    });

    $scope.swipeLeft = next;
    $scope.swipeRight = prev;

    var miniCalendarHidden = true;

    $scope.eventClick = function(event) {
      openEventForm(event.clone());
    };

    $scope.eventDropAndResize = function(drop, event, delta, revert) {
      var newEvent = event.clone();
      newEvent.start = event.start;
      newEvent.end = event.end;
      newEvent.path = newEvent.path || '/calendars/' + $scope.calendarHomeId + '/' + DEFAULT_CALENDAR_ID;

      function revertFunc() {
        revert();
        $rootScope.$broadcast(CALENDAR_EVENTS.REVERT_MODIFICATION, event);
      }

      calendarService.modifyEvent(newEvent.path, newEvent, event, newEvent.etag, revertFunc, { graceperiod: true, notifyFullcalendar: true })
        .then(function(completed) {
          if (completed) {
            notificationFactory.weakInfo('Calendar - ', newEvent.title + ' has been modified.');
          } else {
            notificationFactory.weakInfo('Calendar - ', 'Modification of ' + newEvent.title + ' has been cancelled.');
          }
        });
    };

    windowJQuery.resize($scope.resizeCalendarHeight);

    calendarService.calendarHomeId = $scope.calendarHomeId;

    $scope.eventRender = eventUtils.render;

    var currentView = calendarCurrentView.get();
    $scope.uiConfig.calendar.defaultDate = currentView.start || $scope.uiConfig.calendar.defaultDate;
    $scope.uiConfig.calendar.defaultView = currentView.name || $scope.uiConfig.calendar.defaultView;

    $scope.uiConfig.calendar.eventRender = $scope.eventRender;

    /*
     * "eventAfterAllRender" is called when all events are fetched but it
     * is not called when the davserver is unreachable so the "viewRender"
     * event is used to set the correct height but the event is called too
     * early and the calendar offset is wrong so wait with a timeout.
     */
    $scope.uiConfig.calendar.eventAfterAllRender = $scope.resizeCalendarHeight;

    $scope.uiConfig.calendar.viewRender = function(view) {
      calendarDeffered.resolve(uiCalendarConfig.calendars[$scope.calendarHomeId]);
      $timeout($scope.resizeCalendarHeight, 1000);
      calendarCurrentView.set(view);
      $rootScope.$broadcast(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, view);
    };

    $scope.uiConfig.calendar.eventClick = $scope.eventClick;
    $scope.uiConfig.calendar.eventResize = $scope.eventDropAndResize.bind(null, false);
    $scope.uiConfig.calendar.eventDrop = $scope.eventDropAndResize.bind(null, true);
    $scope.uiConfig.calendar.select = function(start, end) {
      var date = calendarUtils.getDateOnCalendarSelect(start, end);
      var event = CalendarShell.fromIncompleteShell({
        start: date.start,
        end: date.end
      });
      openEventForm(event);
    };

    $scope.displayCalendarError = function(err, errorMessage) {
      $alert({
        content: err && err.message || errorMessage,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.calendar-error-message',
        duration: '3',
        animation: 'am-flip-x'
      });
    };

    $scope.eventSourcesMap = {};
    $scope.eventSources = [];

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

    function rerenderCalendar() {
      calendarPromise.then(function(calendar) {
        calendar.fullCalendar('refetchEvents');
      });
    }

    var unregisterFunctions = [
      $rootScope.$on(CALENDAR_EVENTS.ITEM_MODIFICATION, rerenderCalendar),
      $rootScope.$on(CALENDAR_EVENTS.ITEM_REMOVE, rerenderCalendar),
      $rootScope.$on(CALENDAR_EVENTS.ITEM_ADD, rerenderCalendar),
      $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) {
        calendarPromise.then(function(cal) {
          if (data.hidden) {
            cal.fullCalendar('removeEventSource', $scope.eventSourcesMap[data.calendar.href]);
          } else {
            cal.fullCalendar('addEventSource', $scope.eventSourcesMap[data.calendar.href]);
          }
        });
      }),
      $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.DATE_CHANGE, function(event, newDate) {
        calendarPromise.then(function(calendar) {
          var view = calendar.fullCalendar('getView');
          if (newDate && !newDate.isBetween(view.start, view.end)) {
            calendar.fullCalendar('gotoDate', newDate);
          }
        });
      }),
      $rootScope.$on(CALENDAR_EVENTS.CALENDARS.ADD, function(event, calendar) {
        $scope.calendars.push(calendar);
      }),
      $rootScope.$on(CALENDAR_EVENTS.CALENDARS.UPDATE, function(event, calendar) {
        $scope.calendars.forEach(function(cal, index) {
          if (calendar.id === cal.id) {
            $scope.calendars[index] = calendar;
          }
        });
      }),
      $rootScope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, function() {
        miniCalendarHidden = !miniCalendarHidden;
      }),
      $rootScope.$on(CALENDAR_EVENTS.VIEW_TRANSLATION, function(event, action) {
        if (miniCalendarHidden) {
          (action === 'prev' ? prev : next)();
        }
      })
    ];

    function liveNotificationHandlerOnCreateRequestandUpdate(msg) {
      var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});
      cachedEventSource.registerUpdate(event);
      masterEventCache.save(event);
      calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
    }

    function liveNotificationHandlerOnDelete(msg) {
      var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});
      cachedEventSource.registerDelete(event);
      masterEventCache.remove(event);
      calendarEventEmitter.fullcalendar.emitRemovedEvent(event);
    }

    var sio = livenotification('/calendars');
    sio.on(CALENDAR_EVENTS.WS.EVENT_CREATED, liveNotificationHandlerOnCreateRequestandUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_REQUEST, liveNotificationHandlerOnCreateRequestandUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_CANCEL, liveNotificationHandlerOnDelete);
    sio.on(CALENDAR_EVENTS.WS.EVENT_UPDATED, liveNotificationHandlerOnCreateRequestandUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_DELETED, liveNotificationHandlerOnDelete);
    sio.on(CALENDAR_EVENTS.WS.EVENT_REPLY, liveNotificationHandlerOnCreateRequestandUpdate);

    $scope.$on('$destroy', function() {
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CREATED, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_UPDATED, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_DELETED, liveNotificationHandlerOnDelete);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REQUEST, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REPLY, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CANCEL, liveNotificationHandlerOnDelete);
      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });
      gracePeriodService.flushAllTasks();
      cachedEventSource.resetCache();
      windowJQuery.off('resize', $scope.resizeCalendarHeight);
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);
  });
