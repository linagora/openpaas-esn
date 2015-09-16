'use strict';

angular.module('esn.calendar')

  .directive('attendeeListItem', function(ATTENDEE_TYPES) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/attendee-list-item.html',
      scope: {
        attendee: '=',
        readOnly: '='
      },
      link: function(scope) {
        if (scope.attendee.attendeeType === ATTENDEE_TYPES.USER) {
          scope.attendeeType = 'user';
        }
        else {
          scope.attendeeType = 'email';
        }
      }
    };
  });
