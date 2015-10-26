'use strict';

angular.module('esn.calendar')

  .controller('communityCalendarController', function($scope, community, COMMUNITY_UI_CONFIG) {
    $scope.calendarHomeId = community._id;
    $scope.uiConfig = COMMUNITY_UI_CONFIG;
  })

  .controller('userCalendarController', function($scope, user, headerService, USER_UI_CONFIG) {
    $scope.calendarHomeId = user._id;
    $scope.uiConfig = USER_UI_CONFIG;

    headerService.mainHeader.addInjection('calendar-header-content');
    headerService.subHeader.addInjection('calendar-header-mobile', $scope);
    $scope.$on('$destroy', function() {
      headerService.resetAllInjections();
    });
  })

  .controller('calendarController', function($scope, $rootScope, $window, $modal, $timeout, $log, $alert, CalendarShell, uiCalendarConfig, calendarService, calendarUtils, eventUtils, notificationFactory, calendarEventSource, livenotification, gracePeriodService, MAX_CALENDAR_RESIZE_HEIGHT) {

    var windowJQuery = angular.element($window);

    $scope.resizeCalendarHeight = function() {
      var calendar = uiCalendarConfig.calendars[$scope.calendarHomeId];
      var height = windowJQuery.height() - calendar.offset().top;
      height = height > MAX_CALENDAR_RESIZE_HEIGHT ? MAX_CALENDAR_RESIZE_HEIGHT : height;
      calendar.fullCalendar('option', 'height', height);
      $rootScope.$broadcast('calendar:height', height);
    };

    $scope.eventClick = function(event) {
      $scope.event = event;
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/event-quick-form/event-quick-form-modal', backdrop: 'static'});
    };

    $scope.eventDropAndResize = function(event, delta, revertFunc) {
      var path = event.path || '/calendars/' + $scope.calendarHomeId + '/events';
      calendarService.modifyEvent(path, event, null, event.etag, delta.milliseconds !== 0, revertFunc).then(function() {
        notificationFactory.weakInfo('Event modified', event.title + ' has been modified');
      });
    };

    windowJQuery.resize($scope.resizeCalendarHeight);

    calendarService.calendarHomeId = $scope.calendarHomeId;

    $scope.eventRender = eventUtils.render;
    $scope.uiConfig.calendar.eventRender = $scope.eventRender;

    /*
     * "eventAfterAllRender" is called when all events are fetched but it
     * is not called when the davserver is unreachable so the "viewRender"
     * event is used to set the correct height but the event is called too
     * early and the calendar offset is wrong so wait with a timeout.
     */
    $scope.uiConfig.calendar.eventAfterAllRender = $scope.resizeCalendarHeight;
    $scope.uiConfig.calendar.viewRender = function() {
      $timeout($scope.resizeCalendarHeight, 1000);
    };
    $scope.uiConfig.calendar.eventClick = $scope.eventClick;
    $scope.uiConfig.calendar.eventResize = $scope.eventDropAndResize;
    $scope.uiConfig.calendar.eventDrop = $scope.eventDropAndResize;
    $scope.uiConfig.calendar.select = function(start, end) {
      var date = calendarUtils.getDateOnCalendarSelect(start, end);
      $scope.event = {
        start: date.start,
        end: date.end,
        allDay: !start.hasTime(end)
      };
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/event-quick-form/event-quick-form-modal', backdrop: 'static'});
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
        $scope.calendars = calendars;
        $scope.calendars.forEach(function(calendar) {
          $scope.eventSourcesMap[calendar.getHref()] = {
            events: calendarEventSource(calendar.getHref(), $scope.displayCalendarError),
            color: calendar.getColor()
          };
          uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.getHref()]);
        });
      });

    function _modifiedCalendarItem(newEvent) {
      var calendar = uiCalendarConfig.calendars[$scope.calendarHomeId];

      var event = calendar.fullCalendar('clientEvents', newEvent.id)[0];
      if (!event) {
        return;
      }
      angular.extend(event, newEvent);
      // See weird Fullcalendar behavior fullcalendar.js:1858 and fullcalendar.js:1600
      // Fullcalendar does not care about event._allDay or event.allDay and forces a new
      // value for event.allDay depending on if event.start || event.end has a *time* part.
      // The problem being that when fullcalendar transform a Moment into a FCMoment, it loses
      // the allDay property.
      if (newEvent.allDay) {
        event.start = event.start.format('YYYY-MM-DD');
        event.end = event.end ? event.end.format('YYYY-MM-DD') : undefined;
      }
      calendar.fullCalendar('updateEvent', event);
    }

    var unregisterFunctions = [
      $rootScope.$on('modifiedCalendarItem', function(event, data) {
        _modifiedCalendarItem(data);
      }),
      $rootScope.$on('removedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('removeEvents', data);
      }),
      $rootScope.$on('addedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('renderEvent', data);
      }),
      $rootScope.$on('calendars-list:toggleView', function(event, calendar) {
        if (calendar.toggled) {
          uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.href]);
        } else {
          uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('removeEventSource', $scope.eventSourcesMap[calendar.href]);
        }
      }),
      $rootScope.$on('calendars-list:added', function(event, calendars) {
        calendars.forEach(function(calendar) {
          calendarService.createCalendar($scope.calendarHomeId, calendar)
            .then(function() {
              $log.debug('Successfully added a new calendar', calendar);
              // Updating eventSources of fullcalendar
              $scope.eventSourcesMap[calendar.getHref()] = {
                events: calendarEventSource(calendar.getHref(), $scope.displayCalendarError),
                color: calendar.getColor()
              };
              uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('addEventSource', $scope.eventSourcesMap[calendar.getHref()]);
            })
            .catch ($scope.displayCalendarError);
        });
      }),
      $rootScope.$on('calendars-list:removed', function(event, calendars) {
        // TODO not implemented yet
        $log.debug('Calendars to remove', calendars);
      })
    ];

    function liveNotificationHandlerOnCreate(msg) {
      uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('renderEvent', CalendarShell.from(msg));
    }

    function liveNotificationHandlerOnUpdate(msg) {
      _modifiedCalendarItem(CalendarShell.from(msg));
    }

    function liveNotificationHandlerOnDelete(msg) {
      uiCalendarConfig.calendars[$scope.calendarHomeId].fullCalendar('removeEvents', CalendarShell.from(msg).id);
    }

    var sio = livenotification('/calendars');
    sio.on('event:created', liveNotificationHandlerOnCreate);
    sio.on('event:updated', liveNotificationHandlerOnUpdate);
    sio.on('event:deleted', liveNotificationHandlerOnDelete);

    $scope.$on('$destroy', function() {
      sio.removeListener('event:created', liveNotificationHandlerOnCreate);
      sio.removeListener('event:updated', liveNotificationHandlerOnUpdate);
      sio.removeListener('event:deleted', liveNotificationHandlerOnDelete);
      unregisterFunctions.forEach(function(unregisterFunction) {
        unregisterFunction();
      });
      gracePeriodService.flushAllTasks();
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);
  });
