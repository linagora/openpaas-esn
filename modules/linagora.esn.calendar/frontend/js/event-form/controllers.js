'use strict';

angular.module('esn.calendar')

  .controller('eventFormController', function($scope, $alert, CalendarShell, calendarUtils, calendarService, eventUtils, session, notificationFactory, gracePeriodService, EVENT_FORM, EVENT_MODIFY_COMPARE_KEYS) {
    if (!$scope.event) {
      $scope.event = eventUtils.originalEvent;
    }
    if (!$scope.editedEvent) {
      $scope.editedEvent = eventUtils.editedEvent;
    }

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

    this.initFormData = function() {
      if ($scope.selectedEvent) {
        $scope.event = $scope.selectedEvent.clone();
        $scope.editedEvent = $scope.selectedEvent.clone();
      } else if (!$scope.event.start) {
        $scope.event = CalendarShell.fromIncompleteShell({
          start: calendarUtils.getNewStartDate(),
          end: calendarUtils.getNewEndDate()
        });
        $scope.editedEvent = $scope.event.clone();
      }

      $scope.newAttendees = [];

      $scope.invitedAttendee = null;
      $scope.hasAttendees = !!$scope.editedEvent.attendees;

      if ($scope.hasAttendees) {
        $scope.editedEvent.attendees.forEach(function(attendee) {
          if (attendee.email in session.user.emailMap) {
            $scope.invitedAttendee = attendee;
          }
        });
      }
      $scope.isOrganizer = eventUtils.isOrganizer($scope.event);
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

    this.canPerformCall = function() {
      return !$scope.restActive && !gracePeriodService.hasTaskFor({id: $scope.editedEvent.id});
    };

    this.addNewEvent = function() {
      if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
        $scope.editedEvent.title = EVENT_FORM.title.default;
      }

      if (!$scope.calendarHomeId) {
        $scope.calendarHomeId = calendarService.calendarHomeId;
      }

      if ($scope.newAttendees) {
        $scope.editedEvent.attendees = $scope.newAttendees;
      }

      var displayName = session.user.displayName || calendarUtils.displayNameOf(session.user.firstname, session.user.lastname);
      $scope.editedEvent.organizer = { displayName: displayName, emails: session.user.emails };
      var path = '/calendars/' + $scope.calendarHomeId + '/events';
      $scope.restActive = true;
      _hideModal();
      calendarService.createEvent(path, $scope.editedEvent, { graceperiod: true })
        .catch(function(err) {
          _displayNotification(notificationFactory.weakError, 'Event creation failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally(function() {
          $scope.restActive = false;
        });
    };

    this.deleteEvent = function() {
      if (!$scope.calendarHomeId) {
        $scope.calendarHomeId = calendarService.calendarHomeId;
      }
      $scope.restActive = true;
      _hideModal();
      calendarService.removeEvent($scope.event.path, $scope.event, $scope.event.etag)
        .catch(function(err) {
          _displayNotification(notificationFactory.weakError, 'Event deletion failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally(function() {
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
      }).finally(function() {
        $scope.restActive = false;
      });
    }

    function modifyOrganizerEvent() {
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

      if (JSON.stringify($scope.editedEvent, EVENT_MODIFY_COMPARE_KEYS) === JSON.stringify($scope.event, EVENT_MODIFY_COMPARE_KEYS)) {
        if ($scope.createModal) {
          $scope.createModal.hide();
        }
        return;
      }
      $scope.restActive = true;
      _hideModal();
      var path = $scope.event.path || '/calendars/' + $scope.calendarHomeId + '/events';
      calendarService.modifyEvent(path, $scope.editedEvent, $scope.event, $scope.event.etag, eventUtils.isMajorModification($scope.editedEvent, $scope.event))
        .catch(function(err) {
          _displayNotification(notificationFactory.weakError, 'Event modification failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally(function() {
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
      $scope.$broadcast('event:attendees:updated');
    };
  });
