'use strict';

angular.module('esn.calendar')

  .directive('eventDateConsultation', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/event-date-consultation.html',
      scope: {
        event: '='
      },
      link: function(scope) {
        if (!scope.event.allDay) {
          scope.start = scope.event.start.format('MMMM D hh:mma');
          if (scope.event.start.isSame(scope.event.end, 'day')) {
            scope.end = scope.event.end.format('hh:mma');
          } else {
            scope.end = scope.event.end.format('MMMM D hh:mma');
          }
        } else {
          scope.start = scope.event.start.format('MMMM D');
          scope.end = scope.event.end.clone().subtract(1, 'day').format('MMMM D');
        }
      }
    };
  });
