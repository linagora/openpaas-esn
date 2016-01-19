'use strict';

angular.module('esn.calendar')
  .directive('eventCreateButton', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/components/event-create-button.html'
    };
  });
