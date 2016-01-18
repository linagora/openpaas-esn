'use strict';

angular.module('esn.calendar')

  .directive('attendeeListItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/attendee-list-item.html',
      scope: {
        attendee: '=',
        readOnly: '='
      }
    };
  });
