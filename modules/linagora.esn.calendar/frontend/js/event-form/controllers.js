'use strict';

angular.module('esn.calendar')

  .controller('eventFormController', function($scope, $alert, $state, CalendarShell, calendarUtils, calendarService, eventUtils, session, notificationFactory, EVENT_FORM, EVENT_MODIFY_COMPARE_KEYS, CALENDAR_EVENTS) {
    $scope.restActive = false;
    $scope.EVENT_FORM = EVENT_FORM;

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

    function _hideModal() {
      if ($scope.$hide) {
        $scope.$hide();
      }
    }

    function _displayNotification(notificationFactoryFunction, title, content) {
      notificationFactoryFunction(title, content);
      _hideModal();
    }

    function initFormData() {
      $scope.editedEvent = $scope.event.clone();
      $scope.newAttendees = eventUtils.getNewAttendees();
      $scope.invitedAttendee = null;
      $scope.hasAttendees = !!$scope.editedEvent.attendees;
      if ($scope.hasAttendees) {
        $scope.editedEvent.attendees.forEach(function(attendee) {
          if (attendee.email in session.user.emailMap) {
            $scope.invitedAttendee = attendee;
          }
        });
      }
      $scope.isOrganizer = eventUtils.isOrganizer($scope.editedEvent);
    }

    function canPerformCall() {
      return !$scope.restActive;
    }

    function createEvent() {
      if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
        $scope.editedEvent.title = EVENT_FORM.title.default;
      }

      if (!$scope.calendarHomeId) {
        $scope.calendarHomeId = calendarService.calendarHomeId;
      }

      if ($scope.editedEvent.attendees && $scope.newAttendees) {
        $scope.editedEvent.attendees = $scope.editedEvent.attendees.concat($scope.newAttendees);
      } else {
        $scope.editedEvent.attendees = $scope.newAttendees;
      }

      var displayName = session.user.displayName || calendarUtils.displayNameOf(session.user.firstname, session.user.lastname);
      $scope.editedEvent.organizer = { displayName: displayName, emails: session.user.emails };
      var calendarId = 'events';
      var path = '/calendars/' + $scope.calendarHomeId + '/' + calendarId;
      $scope.restActive = true;
      _hideModal();
      calendarService.createEvent(calendarId, path, $scope.editedEvent, { graceperiod: true })
        .then(function(response) {
          if (response) {
            notificationFactory.weakInfo('Calendar - ', $scope.editedEvent.title + ' has been created.');
          }
        })
        .catch(function(err) {
          _displayNotification(notificationFactory.weakError, 'Event creation failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally(function() {
          $scope.restActive = false;
        });
    }

    function deleteEvent() {
      if (!$scope.calendarHomeId) {
        $scope.calendarHomeId = calendarService.calendarHomeId;
      }
      $scope.restActive = true;
      _hideModal();
      calendarService.removeEvent($scope.event.path, $scope.event, $scope.event.etag)
        .then(function(response) {
          if (response) {
            notificationFactory.weakInfo('Calendar - ', $scope.event.title + ' has been deleted.');
          }
        })
        .catch(function(err) {
          _displayNotification(notificationFactory.weakError, 'Event deletion failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally(function() {
          $scope.restActive = false;
        });
    }

    function _modifyAttendeeEvent() {
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
        _displayNotification(notificationFactory.weakInfo, 'Calendar - ', icalPartStatToReadableStatus[status]);
      }, function(err) {
        _displayNotification(notificationFactory.weakError, 'Event participation modification failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
      }).finally(function() {
        $scope.restActive = false;
      });
    }

    function _modifyOrganizerEvent() {
      if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
        _displayError(new Error('You must define an event title'));
        return;
      }

      if (!$scope.calendarHomeId) {
        $scope.calendarHomeId = calendarService.calendarHomeId;
      }

      if ($scope.editedEvent.attendees && $scope.newAttendees) {
        $scope.editedEvent.attendees = $scope.editedEvent.attendees.concat($scope.newAttendees);
      } else {
        $scope.editedEvent.attendees = $scope.newAttendees;
      }

      function _hasModificationsBetween(eventA, eventB) {
        return EVENT_MODIFY_COMPARE_KEYS.some(function(key) {
          return !angular.equals(eventA[key], eventB[key]);
        });
      }

      if (!_hasModificationsBetween($scope.editedEvent, $scope.event)) {
        _hideModal();
        return;
      }
      _hideModal();
      $scope.restActive = true;
      var path = $scope.event.path || '/calendars/' + $scope.calendarHomeId + '/events';
      calendarService.modifyEvent(path, $scope.editedEvent, $scope.event, $scope.event.etag, eventUtils.hasSignificantChange($scope.event, $scope.editedEvent))
        .then(function(response) {
          if (response) {
            notificationFactory.weakInfo('Calendar - ', $scope.event.title + ' has been modified.');
          }
        })
        .catch(function(err) {
          _displayNotification(notificationFactory.weakError, 'Event modification failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally(function() {
          $scope.restActive = false;
        });
    }

    function modifyEvent() {
      if ($scope.isOrganizer) {
        _modifyOrganizerEvent();
      } else {
        _modifyAttendeeEvent();
      }
    }

    function changeParticipation(status) {
      if ($scope.isOrganizer && !$scope.invitedAttendee) {
        var organizer = angular.copy($scope.editedEvent.organizer);
        organizer.partstat = status;
        $scope.editedEvent.attendees = $scope.editedEvent.attendees.concat(organizer);
        $scope.invitedAttendee = organizer;
      } else if ($scope.isOrganizer && $scope.invitedAttendee.partstat !== status) {
        $scope.editedEvent.changeParticipation(status, [$scope.invitedAttendee.email]);
      }

      $scope.invitedAttendee.partstat = status;
      $scope.$broadcast(CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, $scope.editedEvent.attendees);
    }

    $scope.initFormData = initFormData;
    $scope.changeParticipation = changeParticipation;
    $scope.modifyEvent = modifyEvent;
    $scope.deleteEvent = deleteEvent;
    $scope.createEvent = createEvent;
    $scope.isNew = eventUtils.isNew;
    $scope.isInvolvedInATask = eventUtils.isInvolvedInATask;
    $scope.submit = function() {
      eventUtils.isNew($scope.editedEvent) && !eventUtils.isInvolvedInATask($scope.editedEvent) ? $scope.createEvent() : $scope.modifyEvent();
    };
    $scope.canPerformCall = canPerformCall;
    $scope.goToCalendar = function(callback) {
      (callback || angular.noop)();
      $state.go('calendar.main');
    };
    $scope.goToFullForm = function() {
      eventUtils.setEditedEvent($scope.editedEvent);
      eventUtils.setNewAttendees($scope.newAttendees);
      _hideModal();
      $state.go('calendar.eventEdit');
    };

    // Initialize the scope of the form. It creates a scope.editedEvent which allows us to
    // rollback to scope.event in case of a Cancel.
    $scope.initFormData();
  });
