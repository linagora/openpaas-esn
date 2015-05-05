'use strict';

angular.module('esn.calendar')
  .directive('eventMessage', ['$rootScope', 'calendarService', 'session', 'moment', function($rootScope, calendarService, session, moment) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/templates/eventMessage.html',
      link: function($scope, element, attrs) {
        $scope.changeParticipation = function(partstat) {
          var vcalendar = $scope.event.vcalendar;
          var path = $scope.event.path;
          var etag = $scope.event.etag;
          var emails = session.user.emails;

          calendarService.changeParticipation(path, vcalendar, emails, partstat, etag).then(function(shell) {
            $scope.partstat = partstat;
            if (shell) {
              $scope.event = shell;
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
          }, function(response) {
            var error = 'Could not retrieve event: ' + response.statusText;
            element.find('>div>.loading').addClass('hidden');
            element.find('>div>.error').text(error).removeClass('hidden');
          });
        }

        updateEvent();
      }
    };
  }])
  .directive('communityButtonEventCreate', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/calendar/views/community/community-button-event-create.html'
    };
  })
  .directive('userButtonEventCreate', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        user: '='
      },
      templateUrl: '/calendar/views/user/user-button-event-create.html'
    };
  })
  .directive('calendarButtonToolbar', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/community/community-calendar-button-toolbar.html'
    };
  })
  .directive('messageEditionEventButton', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/event/message-edition-event-button.html'
    };
  })
  .directive('eventEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/event/event-edition.html'
    };
  })
  .directive('calendarNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/user/user-calendar-navbar-link.html'
    };
  });
