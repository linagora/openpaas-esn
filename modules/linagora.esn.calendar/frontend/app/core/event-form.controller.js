(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalEventFormController', CalEventFormController);

  function CalEventFormController(
    $alert,
    $scope,
    $state,
    $q,
    _,
    calendarService,
    userUtils,
    calEventService,
    calEventUtils,
    notificationFactory,
    calOpenEventForm,
    calUIAuthorizationService,
    session,
    calendarUsersCache,
    esnI18nService,
    CAL_EVENTS,
    CAL_EVENT_FORM) {

      $scope.restActive = false;
      $scope.CAL_EVENT_FORM = CAL_EVENT_FORM;
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

      function displayCalMailToAttendeesButton() {
        if ($scope.calendar && $scope.calendar.readOnly) {
          return calEventUtils.hasAttendees($scope.editedEvent) && !calEventUtils.isInvolvedInATask($scope.editedEvent) && !calEventUtils.isNew($scope.editedEvent) && !$scope.calendar.readOnly;
        }

        return calEventUtils.hasAttendees($scope.editedEvent) && !calEventUtils.isInvolvedInATask($scope.editedEvent) && !calEventUtils.isNew($scope.editedEvent);
      }

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
        $scope.isOrganizer = calEventUtils.isOrganizer($scope.editedEvent);
        $scope.canModifyEventAttendees = calUIAuthorizationService.canModifyEventAttendees($scope.editedEvent);

        calendarService.listCalendars($scope.calendarHomeId)
          .then(function(calendars) {
            $scope.calendars = calendars;
            $scope.calendar = calEventUtils.isNew($scope.editedEvent) ? _.find(calendars, 'selected') : _.find(calendars, function(calendar) {
              if (calendar.isSubscription()) {
                return calendar.source.id === $scope.editedEvent.calendarId;
              }

              return calendar.id === $scope.editedEvent.calendarId;
            });

            $scope.canModifyEvent = _canModifyEvent();
          })
          .then(function() {
            if ($scope.canModifyEvent) {
              setOrganizer();
            } else {
              $scope.editedEvent.organizer && $scope.editedEvent.attendees.push($scope.editedEvent.organizer);
            }

            $scope.userAsAttendee = null;

            $scope.editedEvent.attendees.forEach(function(attendee) {
              if (attendee.email in session.user.emailMap) {
                $scope.userAsAttendee = attendee;
              }
            });

            if (!$scope.editedEvent.class) {
              $scope.editedEvent.class = CAL_EVENT_FORM.class.default;
            }
          })
          .then(function() {
            $scope.displayParticipationButton = displayParticipationButton();
            $scope.displayCalMailToAttendeesButton = displayCalMailToAttendeesButton;
            $scope.canModifyEventRecurrence = calUIAuthorizationService.canModifyEventRecurrence($scope.calendar, $scope.editedEvent, session.user._id);
          });
      }

      function setOrganizer() {
        var displayName;

        if ($scope.calendar.isShared(session.user._id)) {
          return calendarUsersCache.getUser($scope.calendar.rights.getOwnerId()).then(function(user) {
            displayName = userUtils.displayNameOf(user);

            $scope.editedEvent.organizer = { displayName: displayName, emails: user.emails };
            $scope.editedEvent.setOrganizerPartStat($scope.editedEvent.getOrganizerPartStat());
          });
        } else {
          displayName = session.user.displayName || userUtils.displayNameOf(session.user);

          $scope.editedEvent.organizer = { displayName: displayName, emails: session.user.emails };
          $scope.editedEvent.setOrganizerPartStat($scope.editedEvent.getOrganizerPartStat());

          return $q.when();
        }
      }

      function _canModifyEvent() {
        return calUIAuthorizationService.canModifyEvent($scope.calendar, $scope.editedEvent, session.user._id);
      }

      function displayParticipationButton() {
        if ($scope.calendar && $scope.calendar.readOnly) {
          return ($scope.editedEvent.attendees.length > 1 || $scope.newAttendees.length > 0) && !$scope.calendar.readOnly;
        }

        return $scope.editedEvent.attendees.length > 1 || $scope.newAttendees.length > 0;
      }

      function canPerformCall() {
        return !$scope.restActive;
      }

      function createEvent() {
        if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
          $scope.editedEvent.title = CAL_EVENT_FORM.title.default;
        }

        if (!$scope.editedEvent.class) {
          $scope.editedEvent.class = CAL_EVENT_FORM.class.default;
        }

        if ($scope.editedEvent.attendees && $scope.newAttendees) {
          $scope.editedEvent.attendees = $scope.editedEvent.attendees.concat($scope.newAttendees);
        } else {
          $scope.editedEvent.attendees = $scope.newAttendees;
        }

        if ($scope.calendar) {
          var path = '/calendars/' + $scope.calendarHomeId + '/' + $scope.calendar.id;

          $scope.restActive = true;
          _hideModal();
          setOrganizer()
            .then(function() {
              return calEventService.createEvent($scope.calendar.id, path, $scope.editedEvent, {
                graceperiod: true,
                notifyFullcalendar: $state.is('calendar.main')
              });
            })
            .then(function(completed) {
              if (!completed) {
                calOpenEventForm($scope.calendarHomeId, $scope.editedEvent);
              }
            })
            .finally(function() {
              $scope.restActive = false;
            });
        } else {
          _displayNotification(notificationFactory.weakError, 'Event creation failed', 'Cannot join the server, please try later');
        }
      }

      function deleteEvent() {
        $scope.restActive = true;
        _hideModal();
        calEventService.removeEvent($scope.event.path, $scope.event, $scope.event.etag).finally(function() {
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

          if (!$scope.canModifyEvent) {
            var icalPartStatToReadableStatus = Object.create(null);

            icalPartStatToReadableStatus.ACCEPTED = 'You will attend this meeting';
            icalPartStatToReadableStatus.DECLINED = 'You will not attend this meeting';
            icalPartStatToReadableStatus.TENTATIVE = 'You may attend this meeting';
            _displayNotification(notificationFactory.weakInfo, 'Calendar -', icalPartStatToReadableStatus[status]);
          }
        }, function() {
          _displayNotification(notificationFactory.weakError, 'Event participation modification failed', '; Please refresh your calendar');
        }).finally(function() {
          $scope.restActive = false;
        });
      }

      function _modifyEvent() {
        if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
          _displayError(new Error('You must define an event title'));

          return;
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
          .finally(function() {
            $scope.restActive = false;
          });
      }

      function updateAlarm() {
        if ($scope.event.alarm && $scope.event.alarm.trigger) {
          if (!$scope.editedEvent.alarm || $scope.editedEvent.alarm.trigger.toICALString() === $scope.event.alarm.trigger.toICALString()) {
            return;
          }
        }
        var path = $scope.editedEvent.path || '/calendars/' + $scope.calendarHomeId + '/' + $scope.calendar.id;

        $scope.restActive = true;
        var gracePeriodMessage = {
          performedAction: esnI18nService.translate('You are about to modify alarm of %s', $scope.event.title),
          cancelSuccess: esnI18nService.translate('Modification of %s has been cancelled.', $scope.event.title),
          gracePeriodFail: esnI18nService.translate('Modification of %s failed. Please refresh your calendar', $scope.event.title),
          successText: esnI18nService.translate('Alarm of %s has been modified.', $scope.event.title)
        };

        calEventService.modifyEvent(path, $scope.editedEvent, $scope.event, $scope.event.etag, angular.noop, gracePeriodMessage).finally(function() {
            $scope.restActive = false;
          });
      }

      function modifyEvent() {
        if ($scope.canModifyEvent) {
          _modifyEvent();
        } else {
          _changeParticipationAsAttendee();
        }
      }

      function changeParticipation(status) {
        $scope.userAsAttendee.partstat = status;
        if ($scope.isOrganizer) {
          if (status !== $scope.editedEvent.getOrganizerPartStat()) {
            $scope.editedEvent.setOrganizerPartStat(status);
            $scope.$broadcast(CAL_EVENTS.EVENT_ATTENDEES_UPDATE, $scope.editedEvent.attendees);
          }
        } else {
          $scope.editedEvent.changeParticipation(status, [$scope.userAsAttendee.email]);
          $scope.$broadcast(CAL_EVENTS.EVENT_ATTENDEES_UPDATE, $scope.editedEvent.attendees);

          _changeParticipationAsAttendee();

          if (!$scope.canModifyEvent) {
            if ($state.is('calendar.event.form') || $state.is('calendar.event.consult')) {
              $state.go('calendar.main');
            } else {
              _hideModal();
            }
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
        $state.go('calendar.event.form', {calendarId: $scope.calendarHomeId, eventId: $scope.editedEvent.id});
      }
  }
})();
