'use strict';

angular.module('esn.calendar')

  .controller('eventFormController', function($rootScope, $scope, $alert, calendarUtils, calendarService, eventService, gracePeriodService, moment, session, notificationFactory, ICAL_PROPERTIES, EVENT_FORM, EVENT_MODIFY_COMPARE_KEYS) {

    $scope.editedEvent = {};
    $scope.restActive = false;
    $scope.EVENT_FORM = EVENT_FORM;

    this.isNew = function(event) {
      return angular.isUndefined(event._id);
    };

    function _displayError(err) {
      $alert({
        content: err.message || err.statusText,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.event-create-error-message',
        duration: '2',
        animation: 'am-flip-x'
      });
    }

    function updateAttendeeStats() {
      var partstatMap = $scope.attendeesPerPartstat = {
        'NEEDS-ACTION': 0,
        'ACCEPTED': 0,
        'TENTATIVE': 0,
        'DECLINED': 0,
        'OTHER': 0
      };

      $scope.invitedAttendee = null;
      $scope.hasAttendees = !!$scope.editedEvent.attendees;

      if ($scope.hasAttendees) {
        $scope.editedEvent.attendees.forEach(function(att) {
          partstatMap[att.partstat in partstatMap ? att.partstat : 'OTHER']++;

          if (att.email in session.user.emailMap) {
            $scope.invitedAttendee = att;
          }
        });
      }
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


      updateAttendeeStats();

      $scope.attendeeClickedCount = 0;
      $scope.isOrganizer = eventService.isOrganizer($scope.event);
      // on load, ensure that duration between start and end is stored inside editedEvent
      this.onEndDateChange();
    };

    function _hideModal() {
      if ($scope.createModal) {
        $scope.createModal.hide();
      }
    }

    function _displayNotification(notificationFactoryFunction, title, content) {
      notificationFactoryFunction(title, content);
      _hideModal();
    }

    this.selectAttendee = function(attendee) {
      attendee.clicked = !attendee.clicked;
      $scope.attendeeClickedCount += attendee.clicked ? 1 : -1;
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
      var displayName = session.user.displayName || calendarUtils.displayNameOf(session.user.firstname, session.user.lastname);
      event.organizer = {
        displayName: displayName,
        emails: session.user.emails
      };
      var path = '/calendars/' + $scope.calendarId + '/events';
      var vcalendar = calendarService.shellToICAL(event);
      $scope.restActive = true;
      _hideModal();
      calendarService.create(path, vcalendar)
        .catch (function(err) {
          _displayNotification(notificationFactory.weakError, 'Event creation failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally (function() {
          $scope.restActive = false;
        });
    };

    this.deleteEvent = function() {
      if (!$scope.calendarId) {
        $scope.calendarId = calendarService.calendarId;
      }
      $scope.restActive = true;
      _hideModal();
      calendarService.remove($scope.event.path, $scope.event, $scope.event.etag)
        .catch (function(err) {
          _displayNotification(notificationFactory.weakError, 'Event deletion failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally (function() {
          $scope.restActive = false;
        });
    };

    this.modifyEvent = function() {
      if ($scope.isOrganizer) {
        modifyOrganizerEvent();
      } else {
        modifyAttendeeEvent();
      }
    };

    function modifyAttendeeEvent() {
      var status = $scope.invitedAttendee.partstat;

      $scope.restActive = true;
      calendarService.changeParticipation($scope.editedEvent.path, $scope.event, session.user.emails, status).then(function(response) {
        if (!response) {
          return _hideModal();
        }
        var icalPartStatToReadableStatus = Object.create(null);
        icalPartStatToReadableStatus.ACCEPTED = 'You will attend this meeting';
        icalPartStatToReadableStatus.DECLINED = 'You will not attend this meeting';
        icalPartStatToReadableStatus.TENTATIVE = 'Your participation is undefined';
        _displayNotification(notificationFactory.weakInfo, 'Event participation modified', icalPartStatToReadableStatus[status]);
      }, function(err) {
        _displayNotification(notificationFactory.weakError, 'Event participation modification failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
      }).finally (function() {
        $scope.restActive = false;
      });
    }

    function modifyOrganizerEvent() {
      if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
        _displayError(new Error('You must define an event title'));
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

      if (JSON.stringify($scope.editedEvent, EVENT_MODIFY_COMPARE_KEYS) === JSON.stringify($scope.event, EVENT_MODIFY_COMPARE_KEYS)) {
        if ($scope.createModal) {
          $scope.createModal.hide();
        }
        return;
      }
      $scope.restActive = true;
      _hideModal();
      var path = $scope.event.path || '/calendars/' + $scope.calendarId + '/events';
      calendarService.modify(path, $scope.editedEvent, $scope.event, $scope.event.etag, eventService.isMajorModification($scope.editedEvent, $scope.event))
        .catch (function(err) {
          _displayNotification(notificationFactory.weakError, 'Event modification failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally (function() {
          $scope.restActive = false;
        });
    }

    this.changeParticipation = function(status) {
      if ($scope.isOrganizer && !$scope.invitedAttendee) {
        var organizer = angular.copy($scope.editedEvent.organizer);
        $scope.editedEvent.attendees.push(organizer);
        $scope.invitedAttendee = organizer;
      }

      $scope.invitedAttendee.partstat = status;
      updateAttendeeStats();
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
  .controller('calendarController', function($scope, $rootScope, $window, $modal, $timeout, $log, $alert, uiCalendarConfig, calendarService, calendarUtils, eventService, notificationFactory, calendarEventSource,  livenotification, gracePeriodService) {

    var windowJQuery = angular.element($window);

    $scope.resizeCalendarHeight = function() {
      var calendar = uiCalendarConfig.calendars[$scope.calendarId];
      calendar.fullCalendar('option', 'height', windowJQuery.height() - calendar.offset().top - 10);
    };

    $scope.eventClick = function(event) {
      $scope.event = event;
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-quick-form-modal', backdrop: 'static'});
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
      $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-quick-form-modal', backdrop: 'static'});
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
      uiCalendarConfig.calendars[$scope.calendarId].fullCalendar('renderEvent', calendarService.icalToShell(msg));
    }

    function liveNotificationHandlerOnUpdate(msg) {
      _modifiedCalendarItem(calendarService.icalToShell(msg));
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
      gracePeriodService.flushAllTasks();
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);
  });
