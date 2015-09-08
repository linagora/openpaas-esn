'use strict';

angular.module('esn.calendar')

  .controller('eventFormController', function($rootScope, $scope, $alert, calendarUtils, calendarService, calendarEventEmitter, eventService, gracePeriodService, moment, session, notificationFactory, ICAL_PROPERTIES, EVENT_FORM, EVENT_MODIFY_COMPARE_KEYS) {

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
      if ($scope.editedEvent.start && $scope.editedEvent.start.isSame($scope.editedEvent.end, 'day')) {
        return $scope.editedEvent.start;
      }
      return null;
    };

    this.onStartDateChange = function() {
      $scope.editedEvent.end = moment($scope.editedEvent.start).add($scope.editedEvent.diff / 1000 || 3600, 'seconds');
    };

    this.onEndDateChange = function() {
      if ($scope.editedEvent.end.isBefore($scope.editedEvent.start)) {
        $scope.editedEvent.end = moment($scope.editedEvent.start).add(1, 'hours');
      }
      $scope.editedEvent.diff = $scope.editedEvent.end.diff($scope.editedEvent.start);
    };
  });
