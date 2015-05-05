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
  .directive('buttonEventCreate', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/partials/button-event-creation.html'
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
  .directive('eventCreate', ['widget.wizard', '$timeout', '$location', '$alert', '$rootScope',
    function(Wizard, $timeout, $location, $alert, $rootScope) {
      function link($scope, element) {
        $scope.wizard = new Wizard([
          '/calendar/views/message/event/event-creation-wizard'
        ]);
        $rootScope.$on('modal.show', function() {
          element.find('#title').focus();
        });
      }
      return {
        restrict: 'E',
        templateUrl: '/calendar/views/message/event/event-create',
        scope: {
          user: '=',
          domain: '=',
          createModal: '='
        },
        link: link
      };
    }
  ])
  .directive('eventEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/message/event/event-edition.html'
    };
  })
  .directive('eventForm', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/partials/event-form.html'
    };
  })
  .directive('calendarNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/user/user-calendar-navbar-link.html'
    };
  });
