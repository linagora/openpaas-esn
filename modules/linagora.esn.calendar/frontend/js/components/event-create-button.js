'use strict';

angular.module('esn.calendar')
  .directive('eventCreateButton', function(openEventForm, CalendarShell, calendarUtils) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/components/event-create-button.html',
      link: function(scope) {
        scope.openEventForm = function() {
          openEventForm(CalendarShell.fromIncompleteShell({
            start: calendarUtils.getNewStartDate(),
            end: calendarUtils.getNewEndDate()
          }));
        };
      }
    };
  });
