'use strict';

angular.module('esn.calendar')

  .directive('attendeesList', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/attendees-list.html',
      scope: {
        attendees: '=',
        readOnly: '='
      },
      link: function(scope) {
        scope.attendeeClickedCount = 0;

        function updateAttendeeStats(attendees) {
          var partstatMap = scope.attendeesPerPartstat = {
            'NEEDS-ACTION': 0,
            ACCEPTED: 0,
            TENTATIVE: 0,
            DECLINED: 0,
            OTHER: 0
          };

          if (!attendees || !attendees.length) {
            return;
          }

          attendees.forEach(function(attendee) {
            partstatMap[attendee.partstat in partstatMap ? attendee.partstat : 'OTHER']++;
          });
        }

        scope.selectAttendee = function(attendee) {
          attendee.clicked = !attendee.clicked;
          scope.attendeeClickedCount += attendee.clicked ? 1 : -1;
        };

        scope.deleteSelectedAttendees = function() {
          scope.attendees = scope.attendees.filter(function(attendee) { return !attendee.clicked;});
        };

        updateAttendeeStats(scope.attendees);
        scope.$on('event:attendees:updated', function(event, data) {
          updateAttendeeStats(data);
        });
      }
    };
  });
