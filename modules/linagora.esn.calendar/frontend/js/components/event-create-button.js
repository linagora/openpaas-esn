'use strict';

angular.module('esn.calendar')
  .directive('eventCreateButton', function(openEventForm, eventUtils) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/components/event-create-button.html',
      link: function(scope) {
        scope.openEventForm = openEventForm;
      }
    };
  });
