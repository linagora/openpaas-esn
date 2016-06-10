'use strict';

angular.module('esn.calendar')
  .factory('eventMessageService', function() {
    return {
      computeAttendeeStats: function(attendees) {
        var partstatMap = {
          'NEEDS-ACTION': 0,
          ACCEPTED: 0,
          TENTATIVE: 0,
          DECLINED: 0,
          OTHER: 0
        };

        (attendees || []).forEach(function(attendee) {
          partstatMap[attendee.partstat in partstatMap ? attendee.partstat : 'OTHER']++;
        });

        return partstatMap;
      }
    };
  })

  .directive('eventMessage', function(eventService, session, eventMessageService) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/templates/event-message.html',
      link: function(scope, element, attrs) {
        function updateAttendeeStats() {
          scope.attendeesPerPartstat = eventMessageService.computeAttendeeStats(scope.event.attendees);
          scope.hasAttendees = !!scope.event.attendees;
        }

        scope.changeParticipation = function(partstat) {
          var event = scope.event;
          var path = scope.event.path;
          var etag = scope.event.etag;
          var emails = session.user.emails;

          eventService.changeParticipation(path, event, emails, partstat, etag, false)
            .then(function(shell) {
              scope.partstat = partstat;
              if (shell) {
                scope.event = shell;
                updateAttendeeStats();
              }
            });
        };

        function updateEvent() {
          eventService.getEvent(scope.message.eventId).then(function(event) {
            // Set up dom nodes
            scope.event = event;
            element.find('>div>div.loading').addClass('hidden');
            element.find('>div>div.message').removeClass('hidden');

            // Load participation status
            var vcalendar = event.vcalendar;
            var emails = session.user.emails;
            var attendees = eventService.getInvitedAttendees(vcalendar, emails);
            var organizer = attendees.filter(function(att) {
              return att.name === 'organizer' && att.getParameter('partstat');
            });

            var attendee = organizer[0] || attendees[0];
            if (attendee) {
              scope.partstat = attendee.getParameter('partstat');
            }
            updateAttendeeStats();
          }, function(response) {
            var error = 'Could not retrieve event: ' + response.statusText;
            element.find('>div>.loading').addClass('hidden');
            element.find('>div>.error').text(error).removeClass('hidden');
          });
        }
        updateEvent();
      }
    };
  })

  .directive('messageEditionEventButton', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/message-edition-event-button.html'
    };
  })

  .controller('eventMessageEditionController', function($scope, CalendarShell, calendarUtils, calendarService, eventService, calendarEventEmitter, notificationFactory, EVENT_FORM, DEFAULT_CALENDAR_ID) {

    function _initFormData() {
      $scope.event = CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate()
      });
      $scope.restActive = false;
      $scope.EVENT_FORM = EVENT_FORM;
      $scope.activitystream = $scope.$parent.activitystream;
    }

    function _emitPostedMessage(response) {
      if (response && $scope.activitystream) {
        calendarEventEmitter.activitystream.emitPostedMessage(
            response.headers('ESN-Message-Id'),
            $scope.activitystream.activity_stream.uuid);
      }
    }

    function _resetEvent() {
      $scope.rows = 1;
      $scope.event = CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate(),
        diff: 1
      });
    }

    $scope.submit = function() {
      if (!$scope.event.title || $scope.event.title.trim().length === 0) {
        $scope.event.title = EVENT_FORM.title.default;
      }

      if (!$scope.activitystream.activity_stream || !$scope.activitystream.activity_stream.uuid) {
        $scope.displayError('You can not post to an unknown stream');
        return;
      }

      var event = $scope.event;
      var calendarHomeId = $scope.calendarHomeId || calendarService.calendarHomeId;
      var path = '/calendars/' + calendarHomeId + '/' + DEFAULT_CALENDAR_ID;
      $scope.restActive = true;
      eventService.createEvent(calendarHomeId, path, event, { graceperiod: false })
        .then(function(response) {
          _emitPostedMessage(response);
          _resetEvent();
          $scope.$parent.show('whatsup');
        })
      .catch(function(err) {
        notificationFactory.weakError('Event creation failed', (err.statusText || err) + ', Please refresh your calendar');
      })
      .finally(function() {
        $scope.restActive = false;
      });
    };

    // We must init the form on directive load
    _initFormData();
  })

  .directive('eventMessageEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/event-message-edition.html',
      controller: 'eventMessageEditionController'
    };
  });
