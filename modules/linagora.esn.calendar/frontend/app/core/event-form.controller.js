(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calEventFormController', calEventFormController);

  calEventFormController.$inject = [
    '$alert',
    '$scope',
    '$state',
    '_',
    'calendarService',
    'calendarUtils',
    'calEventService',
    'calEventUtils',
    'notificationFactory',
    'calOpenEventForm',
    'session',
    'CALENDAR_EVENTS',
    'EVENT_FORM'
  ];

  function calEventFormController(
    $alert,
    $scope,
    $state,
    _,
    calendarService,
    calendarUtils,
    calEventService,
    calEventUtils,
    notificationFactory,
    calOpenEventForm,
    session,
    CALENDAR_EVENTS,
    EVENT_FORM) {

      $scope.restActive = false;
      $scope.EVENT_FORM = EVENT_FORM;
      $scope.initFormData = initFormData;
      $scope.changeParticipation = changeParticipation;
      $scope.modifyEvent = modifyEvent;
      $scope.deleteEvent = deleteEvent;
      $scope.createEvent = createEvent;
      $scope.isNew = calEventUtils.isNew;
      $scope.isInvolvedInATask = calEventUtils.isInvolvedInATask;
      $scope.updateAlarm = updateAlarm;
      $scope.submit = submit;
      $scope.canPerformCall = canPerformCall;
      $scope.goToCalendar = goToCalendar;
      $scope.goToFullForm = goToFullForm;

      // Initialize the scope of the form. It creates a scope.editedEvent which allows us to
      // rollback to scope.event in case of a Cancel.
      $scope.initFormData();

      ////////////

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
        $scope.newAttendees = calEventUtils.getNewAttendees();
        calendarService.listCalendars(calendarService.calendarHomeId).then(function(calendars) {
          $scope.calendars = calendars;
          $scope.calendar = calEventUtils.isNew($scope.editedEvent) ? _.find(calendars, 'selected') : _.find(calendars, {id: $scope.editedEvent.calendarId});
        });
        $scope.isOrganizer = calEventUtils.isOrganizer($scope.editedEvent);
        if ($scope.isOrganizer) {
          initOrganizer();
        } else {
          $scope.editedEvent.attendees.push($scope.editedEvent.organizer);
        }
        $scope.userAsAttendee = null;
        $scope.editedEvent.attendees.forEach(function(attendee) {
          if (attendee.email in session.user.emailMap) {
            $scope.userAsAttendee = attendee;
          }
        });
      }

      function initOrganizer() {
        var displayName = session.user.displayName || calendarUtils.displayNameOf(session.user.firstname, session.user.lastname);

        $scope.editedEvent.organizer = { displayName: displayName, emails: session.user.emails };
        $scope.editedEvent.setOrganizerPartStat($scope.editedEvent.getOrganizerPartStat());
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

        var path = '/calendars/' + $scope.calendarHomeId + '/' + $scope.calendar.id;

        $scope.restActive = true;
        _hideModal();
        calEventService.createEvent($scope.calendar.id, path, $scope.editedEvent, { graceperiod: true, notifyFullcalendar: $state.is('calendar.main') })
          .then(function(completed) {
            if (completed) {
              notificationFactory.weakInfo('Calendar - ', $scope.editedEvent.title + ' has been created.');
            } else {
              calOpenEventForm($scope.editedEvent);
            }
          })
          .catch(function(err) {
            _displayNotification(notificationFactory.weakError, 'Event creation failed', (err.statusText || err) + ', Please refresh your calendar');
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
        calEventService.removeEvent($scope.event.path, $scope.event, $scope.event.etag)
          .then(function(completed) {
            if (completed) {
              notificationFactory.weakInfo('Calendar - ', $scope.event.title + ' has been deleted.');
            } else {
              notificationFactory.weakInfo('Calendar - ', 'Suppression of ' + $scope.event.title + ' has been cancelled.');
            }
          })
          .catch(function(err) {
            _displayNotification(notificationFactory.weakError, 'Event deletion failed', (err.statusText || err) + ', Please refresh your calendar');
          })
          .finally(function() {
            $scope.restActive = false;
          });
      }

      function _changeParticipationAsAttendee() {
        var status = $scope.userAsAttendee.partstat;

        $scope.restActive = true;
        calEventService.changeParticipation($scope.editedEvent.path, $scope.event, session.user.emails, status).then(function(response) {
          if (!response) {
            return _hideModal();
          }
          var icalPartStatToReadableStatus = Object.create(null);

          icalPartStatToReadableStatus.ACCEPTED = 'You will attend this meeting';
          icalPartStatToReadableStatus.DECLINED = 'You will not attend this meeting';
          icalPartStatToReadableStatus.TENTATIVE = 'Your participation is undefined';
          _displayNotification(notificationFactory.weakInfo, 'Calendar - ', icalPartStatToReadableStatus[status]);
        }, function(err) {
          _displayNotification(notificationFactory.weakError, 'Event participation modification failed', (err.statusText || err) + ', Please refresh your calendar');
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
        }

        if (!calEventUtils.hasAnyChange($scope.editedEvent, $scope.event)) {
          _hideModal();

          return;
        }

        var path = $scope.event.path || '/calendars/' + $scope.calendarHomeId + '/' + $scope.calendar.id;

        $scope.restActive = true;
        _hideModal();

        if ($scope.event.rrule && !$scope.event.rrule.equals($scope.editedEvent.rrule)) {
          $scope.editedEvent.deleteAllException();
        }

        calEventService.modifyEvent(path, $scope.editedEvent, $scope.event, $scope.event.etag, angular.noop, { graceperiod: true, notifyFullcalendar: $state.is('calendar.main') })
          .then(function(completed) {
            if (completed) {
              notificationFactory.weakInfo('Calendar - ', $scope.event.title + ' has been modified.');
            } else {
              notificationFactory.weakInfo('Calendar - ', 'Modification of ' + $scope.event.title + ' has been cancelled.');
            }
          })
          .catch(function(err) {
            _displayNotification(notificationFactory.weakError, 'Event modification failed', (err.statusText || err) + ', Please refresh your calendar');
          })
          .finally(function() {
            $scope.restActive = false;
          });
      }

      function updateAlarm() {
        if (!$scope.calendarHomeId) {
          $scope.calendarHomeId = calendarService.calendarHomeId;
        }
        if ($scope.event.alarm && $scope.event.alarm.trigger) {
          if (!$scope.editedEvent.alarm || $scope.editedEvent.alarm.trigger.toICALString() === $scope.event.alarm.trigger.toICALString()) {
            return;
          }
        }
        var path = $scope.editedEvent.path || '/calendars/' + $scope.calendarHomeId + '/' + $scope.calendar.id;

        $scope.restActive = true;
        calEventService.modifyEvent(path, $scope.editedEvent, $scope.event, $scope.event.etag, angular.noop)
          .then(function(completed) {
            if (completed) {
              notificationFactory.weakInfo('Alarm of ', $scope.event.title + ' has been modified.');
            } else {
              notificationFactory.weakInfo('Modification of ' + $scope.event.title + ' has been cancelled.');
            }
          })
          .catch(function(err) {
            _displayNotification(notificationFactory.weakError, 'Alarm modification failed', (err.statusText || err) + ', Please refresh your calendar');
          })
          .finally(function() {
            $scope.restActive = false;
          });
      }

      function modifyEvent() {
        if ($scope.isOrganizer) {
          _modifyOrganizerEvent();
        } else {
          _changeParticipationAsAttendee();
        }
      }

      function changeParticipation(status) {
        $scope.userAsAttendee.partstat = status;
        if ($scope.isOrganizer) {
          if (status !== $scope.editedEvent.getOrganizerPartStat()) {
            $scope.editedEvent.setOrganizerPartStat(status);
            $scope.$broadcast(CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, $scope.editedEvent.attendees);
          }
        } else {
          $scope.editedEvent.changeParticipation(status, [$scope.userAsAttendee.email]);
          $scope.$broadcast(CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, $scope.editedEvent.attendees);

          _changeParticipationAsAttendee();
          if ($state.is('calendar.event.form') || $state.is('calendar.event.consult')) {
            $state.go('calendar.main');
          } else {
            _hideModal();
          }
        }
      }

      function submit() {
        calEventUtils.isNew($scope.editedEvent) && !calEventUtils.isInvolvedInATask($scope.editedEvent) ? $scope.createEvent() : $scope.modifyEvent();
      }

      function goToCalendar(callback) {
        (callback || angular.noop)();
        $state.go('calendar.main');
      }

      function goToFullForm() {
        calEventUtils.setEditedEvent($scope.editedEvent);
        calEventUtils.setNewAttendees($scope.newAttendees);
        _hideModal();
        $state.go('calendar.event.form', {calendarId: calendarService.calendarHomeId, eventId: $scope.editedEvent.id});
      }
  }
})();
