'use strict';

angular.module('esn.calendar')

  .directive('miniCalendar', function() {
    function link(scope) {
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/mini-calendar.html',
      scope: {
        calendarId: '='
      },
      link: link
    };
  });
