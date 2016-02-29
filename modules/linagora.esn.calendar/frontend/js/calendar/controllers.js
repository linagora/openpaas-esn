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
      keepChangeDuringGraceperiod,
      CalendarShell,
      uiCalendarConfig,
      calendarService,
      calendarUtils,
      eventUtils,
      notificationFactory,
      calendarEventSource,
      livenotification,
      gracePeriodService,
      calendarCurrentView,
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

    $scope.eventDropAndResize = function(drop, event, delta) {
      var path = event.path || '/calendars/' + $scope.calendarHomeId + '/' + DEFAULT_CALENDAR_ID;
      var newEvent = new CalendarShell(event.vcalendar, {
        etag: event.etag,
        path: event.path,
        gracePeriodTaskId: event.gracePeriodTaskId
      });
      newEvent.start = event.start;
      newEvent.end = event.end;

      var oldEvent = newEvent.clone();
      oldEvent.end = oldEvent.end.subtract(delta);

      if (drop) {
        oldEvent.start = oldEvent.start.subtract(delta);
      }

      function revertFunc() {
        $rootScope.$broadcast(CALENDAR_EVENTS.REVERT_MODIFICATION, oldEvent);
      }

      calendarService.modifyEvent(path, newEvent, oldEvent, newEvent.etag, revertFunc, { graceperiod: true, notifyFullcalendar: true })
        .then(function(completed) {
          if (completed) {
            notificationFactory.weakInfo('Calendar - ', newEvent.title + ' has been modified.');
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
      calendarCurrentView.save(view);
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
            events: keepChangeDuringGraceperiod.wrapEventSource(calendar.id, calendarEventSource(calendar.href, $scope.displayCalendarError)),
            backgroundColor: calendar.color
          };
          calendarPromise.then(function(cal) {
            cal.fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.href]);
          });
        });
      })
      .catch($scope.displayCalendarError);

    function _modifiedOrCreatedCalendarItem(newEvent) {
      calendarPromise.then(function(calendar) {
        if (newEvent.isRecurring()) {
          var view = calendar.fullCalendar('getView');
          newEvent.expand(view.start, view.end.add(1, 'day')).forEach(_modifiedOrCreatedCalendarItem);
          return;
        }

        var event = (calendar.fullCalendar('clientEvents', newEvent.id) || [])[0];
        if (!event) {
          calendar.fullCalendar('renderEvent', newEvent);
          return;
        }

        // We fake the _allDay property to fix the case when switching from
        // allday to non-allday, as otherwise the end date is cleared and then
        // set to the wrong date by fullcalendar.
        newEvent._allDay = newEvent.allDay;
        newEvent._end = event._end;
        newEvent._id =  event._id;
        newEvent._start = event._start;

        /*
         * OR-1426 removing and create a new event in fullcalendar (events without source property) works much better than
         * updating it. Otherwise, we are loosing datas and synchronization like vcalendar, allday, attendees, vevent.
         * Also (CAL-97), there are 2 cases:
         *   * events that are updated directly in fullcalendar have a source property
         *   * events that comes from the caldav server have not a source property
         */
        if (!newEvent.source) {
          calendar.fullCalendar('removeEvents', newEvent.id);
          calendar.fullCalendar('renderEvent', newEvent);
        } else {
          calendar.fullCalendar('updateEvent', newEvent);
        }
      });
    }

    var unregisterFunctions = [
      $rootScope.$on(CALENDAR_EVENTS.ITEM_MODIFICATION, function(event, data) {
        calendarService.listCalendars($scope.calendarHomeId).then(function(calendars) {
          _modifiedOrCreatedCalendarItem(eventUtils.setBackgroundColor(data, calendars));
        });
      }),
      $rootScope.$on(CALENDAR_EVENTS.ITEM_REMOVE, function(event, data) {
        calendarPromise.then(function(calendar) {
          calendar.fullCalendar('removeEvents', data);
        });
      }),
      $rootScope.$on(CALENDAR_EVENTS.ITEM_ADD, function(event, data) {
        calendarService.listCalendars($scope.calendarHomeId).then(function(calendarList) {
          _modifiedOrCreatedCalendarItem(eventUtils.setBackgroundColor(data, calendarList));
        });
      }),
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
      calendarService.listCalendars($scope.calendarHomeId).then(function(calendars) {
        _modifiedOrCreatedCalendarItem(eventUtils.setBackgroundColor(CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath}), calendars));
      });
    }

    function liveNotificationHandlerOnReply(msg) {
      $q.all({
        calendar: calendarPromise,
        calendars: calendarService.listCalendars($scope.calendarHomeId)
      }).then(function(resolved) {
        var reply = CalendarShell.from(msg.event);
        var event = eventUtils.setBackgroundColor(resolved.calendar.fullCalendar('clientEvents', reply.id)[0], resolved.calendars);

        eventUtils.applyReply(event, reply);

        if (!event.source) {
          resolved.calendar.fullCalendar('removeEvents', event.id);
          resolved.calendar.fullCalendar('renderEvent', event);
        } else {
          resolved.calendar.fullCalendar('updateEvent', event);
        }
      });
    }

    function liveNotificationHandlerOnDeleteAndCancel(msg) {
      calendarPromise.then(function(calendar) {
        calendar.fullCalendar('removeEvents', CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath}).id);
      });
    }

    var sio = livenotification('/calendars');
    sio.on(CALENDAR_EVENTS.WS.EVENT_CREATED, liveNotificationHandlerOnCreateRequestandUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_REQUEST, liveNotificationHandlerOnCreateRequestandUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_CANCEL, liveNotificationHandlerOnDeleteAndCancel);
    sio.on(CALENDAR_EVENTS.WS.EVENT_UPDATED, liveNotificationHandlerOnCreateRequestandUpdate);
    sio.on(CALENDAR_EVENTS.WS.EVENT_DELETED, liveNotificationHandlerOnDeleteAndCancel);
    sio.on(CALENDAR_EVENTS.WS.EVENT_REPLY, liveNotificationHandlerOnReply);

    $scope.$on('$destroy', function() {
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CREATED, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_UPDATED, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_DELETED, liveNotificationHandlerOnDeleteAndCancel);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REQUEST, liveNotificationHandlerOnCreateRequestandUpdate);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_REPLY, liveNotificationHandlerOnReply);
      sio.removeListener(CALENDAR_EVENTS.WS.EVENT_CANCEL, liveNotificationHandlerOnDeleteAndCancel);
      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });
      gracePeriodService.flushAllTasks();
      keepChangeDuringGraceperiod.resetChange();
      windowJQuery.off('resize', $scope.resizeCalendarHeight);
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);
  });
