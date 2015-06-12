'use strict';

angular.module('esn.calendar')
  .constant('COMMUNITY_UI_CONFIG', {
    calendar: {
      height: 450,
      editable: true,
      timezone: 'local',
      forceEventDuration: true,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      }
    }
  })
  .constant('USER_UI_CONFIG', {
    calendar: {
      defaultView: 'agendaWeek',
      height: 450,
      editable: true,
      selectable: true,
      timezone: 'local',
      forceEventDuration: true,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      // TODO: i18n
      buttonText: {
        today: 'Today',
        month: 'Month',
        week: 'Week',
        day: 'Day'
      },
      handleWindowResize: false
    }
  })

  .controller('eventFormController', ['$rootScope', '$scope', '$alert', 'dateService', 'calendarService', 'moment', 'notificationFactory',
    function($rootScope, $scope, $alert, dateService, calendarService, moment, notificationFactory) {
      $scope.editedEvent = {};
      $scope.restActive = false;

      this.initFormData = function() {
        if (!$scope.event) {
          $scope.event = {
            startDate: dateService.getNewDate(),
            endDate: dateService.getNewEndDate(),
            allDay: false
          };
          $scope.modifyEventAction = false;
        } else {
          $scope.modifyEventAction = true;
        }
        angular.extend($scope.editedEvent, $scope.event);
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
          _displayError('You must define an event title');
          return;
        }
        if (!$scope.calendarId) {
          $scope.calendarId = calendarService.calendarId;
        }
        var event = $scope.editedEvent;
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

          _displayNotification(notificationFactory.weakInfo, 'Event created', $scope.event.title + ' is created');
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

          _displayNotification(notificationFactory.weakInfo, 'Event deleted', $scope.event.title + ' is deleted');
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

        $scope.editedEvent.start = moment($scope.editedEvent.startDate);
        $scope.editedEvent.end = moment($scope.editedEvent.endDate);

        $scope.restActive = true;
        calendarService.modify(path, $scope.editedEvent).then(function(response) {
          if ($scope.activitystream) {
            $rootScope.$emit('message:posted', {
              activitystreamUuid: $scope.activitystream.activity_stream.uuid,
              id: response.headers('ESN-Message-Id')
            });
          }

          _displayNotification(notificationFactory.weakInfo, 'Event modified', $scope.event.title + ' is modified');
        }, function(err) {
          _displayNotification(notificationFactory.weakError, 'Event modification failed', err.statusText + ', ' + 'Please refresh your calendar');
        }).finally (function() {
          $scope.restActive = false;
        });
      };

      this.resetEvent = function() {
        $scope.rows = 1;
        $scope.editedEvent = {
          startDate: dateService.getNewDate(),
          endDate: dateService.getNewEndDate(),
          diff: 1,
          allDay: false
        };
      };

      this.getMinDate = function() {
        if ($scope.editedEvent.startDate) {
          var date = new Date($scope.editedEvent.startDate.getTime());
          date.setDate($scope.editedEvent.startDate.getDate() - 1);
          return date;
        }
        return null;
      };

      this.onAllDayChecked = function() {
        if ($scope.editedEvent.allDay) {
          if (dateService.isSameDay($scope.editedEvent.startDate, $scope.editedEvent.endDate)) {
            $scope.editedEvent.endDate = moment($scope.editedEvent.startDate).add(1, 'days').toDate();
          }
        } else {
          $scope.editedEvent.endDate = $scope.editedEvent.startDate;
        }
      };

      this.onStartDateChange = function() {
        var startDate = moment($scope.editedEvent.startDate);
        var endDate = moment($scope.editedEvent.endDate);
        if (startDate.isAfter(endDate)) {
          startDate.add(1, 'hours');
          $scope.editedEvent.endDate = startDate.toDate();
        }
      };

      this.onStartTimeChange = function() {
        if (dateService.isSameDay($scope.editedEvent.startDate, $scope.editedEvent.endDate)) {
          var startDate = moment($scope.editedEvent.startDate);
          var endDate = moment($scope.editedEvent.endDate);
          $scope.editedEvent.diff = endDate.diff(endDate, 'hours');

          if (startDate.isAfter(endDate) || startDate.isSame(endDate)) {
            startDate.add($scope.editedEvent.diff || 1, 'hours');
            $scope.editedEvent.endDate = startDate.toDate();
          } else {
            endDate = moment(startDate);
            endDate.add($scope.editedEvent.diff || 1, 'hours');
            $scope.editedEvent.endDate = endDate.toDate();
          }
        }
      };

      this.onEndTimeChange = function() {
        if (dateService.isSameDay($scope.editedEvent.startDate, $scope.editedEvent.endDate)) {
          var startDate = moment($scope.editedEvent.startDate);
          var endDate = moment($scope.editedEvent.endDate);

          if (endDate.isAfter(startDate)) {
            $scope.editedEvent.diff = $scope.editedEvent.endDate.getHours() - $scope.editedEvent.startDate.getHours();
          } else {
            $scope.editedEvent.diff = 1;
            endDate = moment(startDate);
            endDate.add($scope.editedEvent.diff, 'hours');
            $scope.editedEvent.endDate = endDate.toDate();
          }
        }
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

  .controller('calendarController', ['$scope', '$rootScope', '$window', '$modal', '$timeout', 'uiCalendarConfig', 'calendarService', 'eventService', 'notificationFactory', 'calendarEventSource',
    function($scope, $rootScope, $window, $modal, $timeout, uiCalendarConfig, calendarService, eventService, notificationFactory, calendarEventSource) {
      $scope.eventSources = [calendarEventSource($scope.calendarId)];

      var windowJQuery = angular.element($window);

      $scope.resizeCalendarHeight = function() {
        var calendar = uiCalendarConfig.calendars[$scope.calendarId];
        calendar.fullCalendar('option', 'height', windowJQuery.height() - calendar.offset().top - 10);
      };

      $scope.eventClick = function(event) {
        $scope.event = event;
        $scope.event.startDate = event.start.toDate();
        $scope.event.endDate = event.end.toDate();
        $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-create-modal', backdrop: 'static'});
      };

      $scope.eventDropAndResize = function(event) {
        var path = '/calendars/' + $scope.calendarId + '/events/' + event.id + '.ics';
        calendarService.modify(path, event).then(function() {
          notificationFactory.weakInfo('Event modified', event.title + ' is modified');
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
        $scope.event = {
          startDate: start.toDate(),
          endDate: end.toDate(),
          allDay: !start.hasTime(end)
        };
        $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-quick-form-modal', backdrop: 'static'});
      };
      $scope.eventSources = [calendarEventSource($scope.calendarId)];

      $rootScope.$on('modifiedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('updateEvent', data);
      });
      $rootScope.$on('removedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('removeEvents', data);
      });
      $rootScope.$on('addedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('renderEvent', data);
      });
    }]);
