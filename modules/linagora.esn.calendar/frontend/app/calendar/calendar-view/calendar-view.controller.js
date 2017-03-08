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
    calMasterEventCache,
    calendarEventEmitter,
    calendarUtils,
    calEventUtils,
    calPublicCalendarStore,
    gracePeriodService,
    livenotification,
    calOpenEventForm,
    elementScrollService,
    CALENDAR_EVENTS,
    DEFAULT_CALENDAR_ID,
    MAX_CALENDAR_RESIZE_HEIGHT,
    esnWithPromiseResult) {

      var windowJQuery = angular.element($window);
      var calendarDeffered = $q.defer();
      var calendarPromise = calendarDeffered.promise;
      var spinnerKey = 'calendar';

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
      $scope.uiConfig.calendar.nextDayThreshold = '00:00';
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
            $scope.calendars = (calendars || []).concat(calPublicCalendarStore.getAll());
            $scope.calendars.forEach(function(calendar) {
              $scope.eventSourcesMap[calendar.id] = {
                events: calCachedEventSource.wrapEventSource(calendar.id, calendarEventSource(calendar.href, $scope.displayCalendarError)),
                backgroundColor: calendar.color
              };

              calendarVisibilityService.isHidden(calendar).then(function(calIsHidden) {
                if (!calIsHidden) {
                  calendarPromise.then(function(cal) {
                    cal.fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.id]);
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
        calOpenEventForm(event.clone());
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
        $rootScope.$broadcast(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, view);
      }

      function select(start, end) {
        var date = calendarUtils.getDateOnCalendarSelect(start, end);
        var event = CalendarShell.fromIncompleteShell({
          start: date.start,
          end: date.end
        });

        calOpenEventForm(event);
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
        $rootScope.$on(CALENDAR_EVENTS.CALENDAR_UNSELECT, withCalendar(function(calendar) {
          calendar.fullCalendar('unselect');
        })),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, withCalendar(function(calendar, event, viewType) {
          calendar.fullCalendar('changeView', viewType);
        })),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, withCalendar(function(calendar, event, data) { // eslint-disable-line
          if (data.hidden) {
            calendar.fullCalendar('removeEventSource', $scope.eventSourcesMap[data.calendarId]);
          } else {
            calendar.fullCalendar('addEventSource', $scope.eventSourcesMap[data.calendarId]);
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

          $scope.eventSourcesMap[calendar.id] = {
            events: calCachedEventSource.wrapEventSource(calendar.id, calendarEventSource(calendar.href, $scope.displayCalendarError)),
            backgroundColor: calendar.color
          };

          calendarPromise.then(function(cal) {
            cal.fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.id]);
          });
        }),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.REMOVE, function(event, calendar) { // eslint-disable-line
          _.remove($scope.calendars, {id: calendar.id});
          var removedEventSource = $scope.eventSourcesMap[calendar.id];

          delete $scope.eventSourcesMap[calendar.id];

          calendarPromise.then(function(cal) {
            cal.fullCalendar('removeEventSource', removedEventSource);
          });
        }),
        $rootScope.$on(CALENDAR_EVENTS.CALENDARS.UPDATE, function(event, calendar) { // eslint-disable-line
          $scope.calendars.forEach(function(cal, index) {
            if (calendar.id === cal.id) {
              $scope.calendars[index] = calendar;
            }
          });
        }),
        $rootScope.$on(CALENDAR_EVENTS.CALENDAR_REFRESH, _rerenderCalendar),
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
      sio.on(CALENDAR_EVENTS.WS.EVENT_REPLY, _liveNotificationHandlerOnReply);

      $scope.$on('$destroy', function() {
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CREATED, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_UPDATED, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_DELETED, _liveNotificationHandlerOnDelete);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REQUEST, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REPLY, _liveNotificationHandlerOnReply);
        sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CANCEL, _liveNotificationHandlerOnDelete);
        unregisterFunctions.forEach(function(unregisterFunction) {
          unregisterFunction();
        });
        gracePeriodService.flushAllTasks();
        calCachedEventSource.resetCache();
        windowJQuery.off('resize', $scope.resizeCalendarHeight);
      });

      function _liveNotificationHandlerOnCreateRequestandUpdate(msg) {
        var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        calCachedEventSource.registerUpdate(event);
        calMasterEventCache.save(event);
        calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
      }

      function _liveNotificationHandlerOnReply(msg) {
        var replyEvent = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        var event = calMasterEventCache.get(replyEvent.path);

        event && event.applyReply(replyEvent);

        $q.when(event || calEventService.getEvent(replyEvent.path)).then(function(event) {
          calMasterEventCache.save(event);
          calCachedEventSource.registerUpdate(event);
          calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
        });
      }

      function _liveNotificationHandlerOnDelete(msg) {
        var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        calCachedEventSource.registerDelete(event);
        calMasterEventCache.remove(event);
        calendarEventEmitter.fullcalendar.emitRemovedEvent(event);
      }
  }
})();
