'use strict';

angular.module('esn.calendar')

  .controller('eventFormController', function($rootScope, $scope, $alert, calendarUtils, calendarService, eventService, moment, notificationFactory, ICAL_PROPERTIES, session, EVENT_FORM) {

    $scope.editedEvent = {};
    $scope.restActive = false;

    this.isNew = function(event) {
      return angular.isUndefined(event._id);
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
      $scope.newAttendees = [];

      if ($scope.editedEvent.attendees) {
        $scope.hasAttendees = true;
        $scope.editedEvent.attendees.forEach(function(att) {
          att.clicked = false;
          if (att.partstat === ICAL_PROPERTIES.partstat.needsaction) {
            $scope.hasNeedActionAttendee = true;
          }
          if (att.partstat === ICAL_PROPERTIES.partstat.accepted) {
            $scope.hasAcceptedAttendee = true;
          }
          if (att.partstat === ICAL_PROPERTIES.partstat.declined) {
            $scope.hasDeclinedAttendee = true;
          }
        });
      }

      if ($scope.event.organizer) {
        $scope.isOrganizer = session.user.emails[0] === $scope.event.organizer.email;
      }
      // on load, ensure that duration between start and end is stored inside editedEvent
      this.onEndDateChange();
    };

    function _displayNotification(notificationFactoryFunction, title, content) {
      notificationFactoryFunction(title, content);
      if ($scope.createModal) {
        $scope.createModal.hide();
      }
    }
    this.selectAttendee = function(attId) {
      $scope.editedEvent.attendees.forEach(function(attendee) {
        if (attendee.id === attId) {
          attendee.clicked = !attendee.clicked;
        }
      });
      $scope.hasAttendeesClicked = true;
    };

    this.deleteSelectedAttendees = function() {
      $scope.editedEvent.attendees = $scope.editedEvent.attendees.filter(function(attendee) { return !attendee.clicked;});
    };

    this.addNewEvent = function() {
      if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
        $scope.editedEvent.title = EVENT_FORM.title.default;
      }

      if (!$scope.calendarId) {
        $scope.calendarId = calendarService.calendarId;
      }
      if ($scope.newAttendees) {
        $scope.editedEvent.attendees = $scope.newAttendees;
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

      if ($scope.editedEvent.attendees && $scope.newAttendees) {
        $scope.editedEvent.attendees = $scope.editedEvent.attendees.concat($scope.newAttendees);
      } else {
        $scope.editedEvent.attendees = $scope.newAttendees;
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
      $scope.editedEvent.end = moment($scope.editedEvent.start).add($scope.editedEvent.diff / 1000 || 3600, 'seconds');
    };

    this.onEndDateChange = function() {
      $scope.editedEvent.diff = $scope.editedEvent.end.diff($scope.editedEvent.start);
    };
  })

  .controller('communityCalendarController', function($scope, community, COMMUNITY_UI_CONFIG) {
    $scope.calendarId = community._id;
    $scope.uiConfig = COMMUNITY_UI_CONFIG;
  })

  .controller('userCalendarController', function($scope, user, USER_UI_CONFIG) {
    $scope.calendarId = user._id;
    $scope.uiConfig = USER_UI_CONFIG;
  })
  .controller('calendarController', function($scope, $rootScope, $window, $modal, $timeout, $log, $alert, uiCalendarConfig, calendarService, calendarUtils, eventService, notificationFactory, calendarEventSource,  livenotification) {

    var windowJQuery = angular.element($window);

    $scope.resizeCalendarHeight = function() {
      var calendar = uiCalendarConfig.calendars[$scope.calendarId];
      calendar.fullCalendar('option', 'height', windowJQuery.height() - calendar.offset().top - 10);
    };

    $scope.eventClick = function(event) {
      $scope.event = event;
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-quick-form-modal', backdrop: 'static'});
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
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-quick-form-modal', backdrop: 'static'});
    };

    $scope.displayCalendarError = function(errorMessage) {
      $alert({
        content: errorMessage,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.calendar-error-message',
        duration: '3',
        animation: 'am-flip-x'
      });
    };

    $scope.eventSources = [calendarEventSource($scope.calendarId, $scope.displayCalendarError)];

    function _modifiedCalendarItem(data) {
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('updateEvent', data);
      var events = uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('clientEvents', data.id);
      eventService.copyNonStandardProperties(data, events[0]);
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
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('renderEvent', calendarService.icalToShell(msg));
    }

    function liveNotificationHandlerOnUpdate(msg) {
      var newEvent = calendarService.icalToShell(msg);
      var oldEvent = uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('clientEvents', newEvent.id)[0];

      newEvent._allDay = oldEvent._allDay;
      newEvent._end = oldEvent._end;
      newEvent._id = oldEvent._id;
      newEvent._start = oldEvent._start;
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('updateEvent', newEvent);
      eventService.copyNonStandardProperties(newEvent, oldEvent);
    }

    function liveNotificationHandlerOnDelete(msg) {
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('removeEvents', calendarService.icalToShell(msg).id);
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
    });
  });
