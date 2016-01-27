'use strict';

angular.module('esn.calendar')
  .directive('eventMessage', function(calendarService, session) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/templates/event-message.html',
      link: function(scope, element, attrs) {
        function updateAttendeeStats() {
          var partstatMap = scope.attendeesPerPartstat = {
            'NEEDS-ACTION': 0,
            ACCEPTED: 0,
            TENTATIVE: 0,
            DECLINED: 0,
            OTHER: 0
          };

          scope.hasAttendees = !!scope.event.attendees;

          if (scope.hasAttendees) {
            scope.event.attendees.forEach(function(attendee) {
              partstatMap[attendee.partstat in partstatMap ? attendee.partstat : 'OTHER']++;
            });
          }
        }

        scope.changeParticipation = function(partstat) {
          var event = scope.event;
          var path = scope.event.path;
          var etag = scope.event.etag;
          var emails = session.user.emails;

          calendarService.changeParticipation(path, event, emails, partstat, etag, false)
            .then(function(shell) {
              scope.partstat = partstat;
              if (shell) {
                scope.event = shell;
                updateAttendeeStats();
              }
            });
        };

        function updateEvent() {
          calendarService.getEvent(scope.message.eventId).then(function(event) {
            // Set up dom nodes
            scope.event = event;
            element.find('>div>div.loading').addClass('hidden');
            element.find('>div>div.message').removeClass('hidden');

            // Load participation status
            var vcalendar = event.vcalendar;
            var emails = session.user.emails;
            var attendees = calendarService.getInvitedAttendees(vcalendar, emails);
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

  .directive('eventMessageEdition', function(CalendarShell, calendarUtils, calendarService, calendarEventEmitter, notificationFactory, EVENT_FORM) {

    function controller($scope) {

      function _initFormData() {
        $scope.event = {
          start: calendarUtils.getNewStartDate(),
          end: calendarUtils.getNewEndDate(),
          allDay: false
        };
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
        $scope.event = {
          start: calendarUtils.getNewStartDate(),
          end: calendarUtils.getNewEndDate(),
          diff: 1,
          allDay: false
        };
      }

      $scope.submit = function() {
        if (!$scope.event.title || $scope.event.title.trim().length === 0) {
          $scope.event.title = EVENT_FORM.title.default;
        }

        if (!$scope.calendarHomeId) {
          $scope.calendarHomeId = calendarService.calendarHomeId;
        }

        if (!$scope.activitystream.activity_stream && !$scope.activitystream.activity_stream.uuid) {
          $scope.displayError('You can not post to an unknown stream');
          return;
        }

        var event = $scope.event;
        var path = '/calendars/' + $scope.calendarHomeId + '/events';
        $scope.restActive = true;
        calendarService.createEvent($scope.calendarHomeId, path, event, { graceperiod: false })
          .then(function(response) {
            _emitPostedMessage(response);
            _resetEvent();
            $scope.$parent.show('whatsup');
          })
          .catch(function(err) {
            notificationFactory.weakError('Event creation failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
          })
          .finally(function() {
            $scope.restActive = false;
          });
      };

      // We must init the form on directive load
      _initFormData();
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/event-message-edition.html',
      controller: controller
    };
  });
