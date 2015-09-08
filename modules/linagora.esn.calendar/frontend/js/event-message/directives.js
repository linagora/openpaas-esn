'use strict';

angular.module('esn.calendar')
  .directive('eventMessage', function(calendarService, session) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/templates/event-message.html',
      link: function($scope, element, attrs) {
        function updateAttendeeStats() {
          var partstatMap = $scope.attendeesPerPartstat = {
            'NEEDS-ACTION': 0,
            'ACCEPTED': 0,
            'TENTATIVE': 0,
            'DECLINED': 0,
            'OTHER': 0
          };

          $scope.hasAttendees = !!$scope.event.attendees;

          if ($scope.hasAttendees) {
            $scope.event.attendees.forEach(function(attendee) {
              partstatMap[attendee.partstat in partstatMap ? attendee.partstat : 'OTHER']++;
            });
          }
        }

        $scope.changeParticipation = function(partstat) {
          var event = $scope.event;
          var path = $scope.event.path;
          var etag = $scope.event.etag;
          var emails = session.user.emails;

          calendarService.changeParticipation(path, event, emails, partstat, etag, false)
            .then(function(shell) {
              $scope.partstat = partstat;
              if (shell) {
                $scope.event = shell;
                updateAttendeeStats();
              }
            });
        };

        function updateEvent() {
          calendarService.getEvent($scope.message.eventId).then(function(event) {
            // Set up dom nodes
            $scope.event = event;
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
              $scope.partstat = attendee.getParameter('partstat');
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

  .directive('eventMessageEdition', function() {

    function link(scope, element, attrs, controller) {
      controller.initFormData();

      scope.submit = controller.addNewEvent;
      scope.resetEvent = controller.resetEvent;
      scope.getMinDate = controller.getMinDate;
      scope.onStartDateChange = controller.onStartDateChange;
      scope.onEndDateChange = controller.onEndDateChange;
      scope.getMinTime = controller.getMinTime;
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-message/event-message-edition.html',
      controller: 'eventMessageController',
      link: link
    };
  });
