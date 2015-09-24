'use strict';

angular.module('esn.calendar')

  .directive('attendeeListItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/attendee-list-item.html',
      scope: {
        attendee: '=',
        readOnly: '='
      }
    };
  });
