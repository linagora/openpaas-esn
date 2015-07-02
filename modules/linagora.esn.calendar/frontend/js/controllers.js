'use strict';

angular.module('esn.calendar')

  .controller('eventFormController', ['$rootScope', '$scope', '$alert', 'calendarUtils', 'calendarService', 'eventService', 'moment', 'notificationFactory', 'session', 'EVENT_FORM',
    function($rootScope, $scope, $alert, calendarUtils, calendarService, eventService, moment, notificationFactory, session, EVENT_FORM) {
      $scope.editedEvent = {};
      $scope.restActive = false;

      this.isNew = function(event) {
        return angular.isUndefined(event._id);
      };

      this.initFormData = function() {
        $scope.event = $scope.event || {};
        if (this.isNew($scope.event)) {
          $scope.event = {
            start: $scope.event.start || calendarUtils.getNewStartDate(),
            end: $scope.event.end || calendarUtils.getNewEndDate(),
            allDay: $scope.event.allDay || false
          };
        }
        eventService.copyEventObject($scope.event, $scope.editedEvent);
      };

      function _displayError(err) {
        $alert({
          content: err,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: '.event-create-error-message',
          duration: '2',
          animation: 'am-flip-x'
        });
      }

      function _displayNotification(notificationFactoryFunction, title, content) {
        notificationFactoryFunction(title, content);
        if ($scope.createModal) {
          $scope.createModal.hide();
        }
      }

      this.addNewEvent = function() {
        if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
          $scope.editedEvent.title = EVENT_FORM.title.default;
        }

        if (!$scope.calendarId) {
          $scope.calendarId = calendarService.calendarId;
        }

        var event = $scope.editedEvent;
        event.organizer = session.user;
        var path = '/calendars/' + $scope.calendarId + '/events';
        var vcalendar = calendarService.shellToICAL(event);
        $scope.restActive = true;
        calendarService.create(path, vcalendar).then(function(response) {
          if ($scope.activitystream) {
            $rootScope.$emit('message:posted', {
              activitystreamUuid: $scope.activitystream.activity_stream.uuid,
              id: response.headers('ESN-Message-Id')
            });
          }

          _displayNotification(notificationFactory.weakInfo, 'Event created', $scope.editedEvent.title + ' has been created');
        }, function(err) {
          _displayNotification(notificationFactory.weakError, 'Event creation failed', err.statusText);
        }).finally (function() {
          $scope.restActive = false;
        });
      };

      this.deleteEvent = function() {
        if (!$scope.calendarId) {
          $scope.calendarId = calendarService.calendarId;
        }
        var path = '/calendars/' + $scope.calendarId + '/events';
        $scope.restActive = true;
        calendarService.remove(path, $scope.event).then(function(response) {
          if ($scope.activitystream) {
            $rootScope.$emit('message:posted', {
              activitystreamUuid: $scope.activitystream.activity_stream.uuid,
              id: response.headers('ESN-Message-Id')
            });
          }

          _displayNotification(notificationFactory.weakInfo, 'Event deleted', $scope.event.title + ' has been deleted');
        }, function(err) {
          _displayNotification(notificationFactory.weakError, 'Event deletion failed', err.statusText + ', ' + 'Please refresh your calendar');
        }).finally (function() {
          $scope.restActive = false;
        });
      };

      this.modifyEvent = function() {
        if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
          _displayError('You must define an event title');
          return;
        }

        if (!$scope.calendarId) {
          $scope.calendarId = calendarService.calendarId;
        }
        var path = '/calendars/' + $scope.calendarId + '/events/' + $scope.editedEvent.id + '.ics';

        if (JSON.stringify($scope.editedEvent) === JSON.stringify($scope.event)) {
          if ($scope.createModal) {
            $scope.createModal.hide();
          }
          return;
        }

        $scope.restActive = true;
        calendarService.modify(path, $scope.editedEvent).then(function(response) {
          if ($scope.activitystream) {
            $rootScope.$emit('message:posted', {
              activitystreamUuid: $scope.activitystream.activity_stream.uuid,
              id: response.headers('ESN-Message-Id')
            });
          }

          _displayNotification(notificationFactory.weakInfo, 'Event modified', $scope.editedEvent.title + ' has been modified');
        }, function(err) {
          _displayNotification(notificationFactory.weakError, 'Event modification failed', err.statusText + ', ' + 'Please refresh your calendar');
        }).finally (function() {
          $scope.restActive = false;
        });
      };

      this.resetEvent = function() {
        $scope.rows = 1;
        $scope.editedEvent = {
          start: calendarUtils.getNewStartDate(),
          end: calendarUtils.getNewEndDate(),
          diff: 1,
          allDay: false
        };
      };

      this.getMinDate = function() {
        if ($scope.editedEvent.start) {
          return moment($scope.editedEvent.start).subtract(1, 'days');
        }
        return null;
      };

      this.getMinTime = function() {
        return $scope.editedEvent.start || null;
      };

      this.onStartDateChange = function() {
        if ($scope.editedEvent.start.isAfter($scope.editedEvent.end)) {
          $scope.editedEvent.end = moment($scope.editedEvent.start).add(1, 'hours');
        }
      };

      this.onStartTimeChange = function() {
        var start = $scope.editedEvent.start;
        var end = $scope.editedEvent.end;
        if (start.isAfter(end) || start.isSame(end)) {
          $scope.editedEvent.end = moment(start).add($scope.editedEvent.diff * 1000 || 3600, 'seconds');
        }
      };

      this.onEndTimeChange = function() {
        $scope.editedEvent.diff = $scope.editedEvent.end.diff($scope.editedEvent.start);
      };
    }])

  .controller('communityCalendarController', ['$scope', 'community', 'COMMUNITY_UI_CONFIG', function($scope, community, COMMUNITY_UI_CONFIG) {
    $scope.calendarId = community._id;
    $scope.uiConfig = COMMUNITY_UI_CONFIG;
  }])

  .controller('userCalendarController', ['$scope', 'user', 'USER_UI_CONFIG', function($scope, user, USER_UI_CONFIG) {
    $scope.calendarId = user._id;
    $scope.uiConfig = USER_UI_CONFIG;
  }])

  .controller('calendarController', ['$scope', '$rootScope', '$window', '$modal', '$timeout', 'uiCalendarConfig', 'calendarService', 'calendarUtils', 'eventService', 'notificationFactory', 'calendarEventSource', 'localEventSource', 'livenotification',
    function($scope, $rootScope, $window, $modal, $timeout, uiCalendarConfig, calendarService, calendarUtils, eventService, notificationFactory, calendarEventSource, localEventSource,  livenotification) {
      $scope.eventSources = [calendarEventSource($scope.calendarId), localEventSource.getEvents];

      var windowJQuery = angular.element($window);

      $scope.resizeCalendarHeight = function() {
        var calendar = uiCalendarConfig.calendars[$scope.calendarId];
        calendar.fullCalendar('option', 'height', windowJQuery.height() - calendar.offset().top - 10);
      };

      $scope.eventClick = function(event) {
        $scope.event = event;
        $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-create-quick-form-modal', backdrop: 'static'});
      };

      $scope.eventDropAndResize = function(event) {
        var path = '/calendars/' + $scope.calendarId + '/events/' + event.id + '.ics';
        calendarService.modify(path, event).then(function() {
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
        $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-create-quick-form-modal', backdrop: 'static'});
      };
      $scope.eventSources = [calendarEventSource($scope.calendarId), localEventSource.getEvents];

      $rootScope.$on('modifiedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('updateEvent', data);
        var events = uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('clientEvents', data.id);
        eventService.copyNonStandardProperties(data, events[0]);
      });
      $rootScope.$on('removedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('removeEvents', data);
      });
      $rootScope.$on('addedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('renderEvent', data);
      });

      function liveNotificationHandler(msg) {
        var event = calendarService.icalToShell(msg);
        var oldVersion = localEventSource.addEvent(event);
        if (oldVersion) {
          $rootScope.$emit('removedCalendarItem', oldVersion.id);
        }
        $rootScope.$emit('addedCalendarItem', event);
      }
      var sio = livenotification('/calendars').on('event:updated', liveNotificationHandler);

      $scope.$on('$destroy', function() {
        sio.removeListener('event:updated', liveNotificationHandler);
      });
    }]);
