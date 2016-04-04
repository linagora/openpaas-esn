'use strict';

angular.module('esn.calendar')

  .directive('attendeeListItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/attendee-list-item.html',
      scope: {
        attendee: '=',
        readOnly: '=',
        isOrganizer: '=',
        mode: '='
      }
    };
  })

  .directive('attendeeListItemEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/attendee-list-item-edition.html',
      scope: {
        attendee: '=',
        readOnly: '=',
        isOrganizer: '='
      }
    };
  })

  .directive('attendeeListItemConsult', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/attendee-list-item-consult.html',
      scope: {
        attendee: '=',
        isOrganizer: '='
      }
    };
  });
