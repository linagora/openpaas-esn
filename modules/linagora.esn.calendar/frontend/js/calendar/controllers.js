'use strict';

angular.module('esn.calendar')

  .controller('communityCalendarController', function($scope, community, COMMUNITY_UI_CONFIG) {
    $scope.calendarId = community._id;
    $scope.uiConfig = COMMUNITY_UI_CONFIG;
  })

  .controller('userCalendarController', function($scope, user, deviceDetector, USER_UI_CONFIG) {
    $scope.calendarId = user._id;
    //The following function should be uncommented once the fullcalendar.js is patched
    //if (deviceDetector.isMobile()) {
    //  USER_UI_CONFIG.calendar.header = false;
    //}
    $scope.uiConfig = USER_UI_CONFIG;
  })

  .controller('calendarController', function($scope, $rootScope, $window, $modal, $timeout, $log, $alert, CalendarShell, uiCalendarConfig, calendarService, calendarUtils, eventService, notificationFactory, calendarEventSource, livenotification, gracePeriodService, MAX_CALENDAR_RESIZE_HEIGHT) {

    var windowJQuery = angular.element($window);

    $scope.resizeCalendarHeight = function() {
      var calendar = uiCalendarConfig.calendars[$scope.calendarId];
      var height = windowJQuery.height() - calendar.offset().top - 10;
      height = height > MAX_CALENDAR_RESIZE_HEIGHT ? MAX_CALENDAR_RESIZE_HEIGHT : height;
      calendar.fullCalendar('option', 'height', height);
      $rootScope.$broadcast('calendar:height', height);
    };

    $scope.eventClick = function(event) {
      $scope.event = event;
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/event-quick-form/event-quick-form-modal', backdrop: 'static'});
    };

    $scope.eventDropAndResize = function(event, delta, revertFunc) {
      var path = event.path || '/calendars/' + $scope.calendarId + '/events';
      calendarService.modify(path, event, null, event.etag, delta.milliseconds !== 0, revertFunc).then(function() {
        notificationFactory.weakInfo('Event modified', event.title + ' has been modified');
      });
    };

    windowJQuery.resize($scope.resizeCalendarHeight);

    calendarService.calendarId = $scope.calendarId;

    $scope.eventRender = eventService.render;
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

    $scope.eventSources = [calendarEventSource($scope.calendarId, $scope.displayCalendarError)];

    function _modifiedCalendarItem(newEvent) {
      var calendar = uiCalendarConfig.calendars[$scope.calendarId];

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
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('removeEvents', data);
      }),
      $rootScope.$on('addedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('renderEvent', data);
      })
    ];

    function liveNotificationHandlerOnCreate(msg) {
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('renderEvent', CalendarShell.from(msg));
    }

    function liveNotificationHandlerOnUpdate(msg) {
      _modifiedCalendarItem(CalendarShell.from(msg));
    }

    function liveNotificationHandlerOnDelete(msg) {
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('removeEvents', CalendarShell.from(msg).id);
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
