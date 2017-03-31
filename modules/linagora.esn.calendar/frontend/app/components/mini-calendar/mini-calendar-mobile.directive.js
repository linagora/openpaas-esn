(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('miniCalendar', miniCalendar);

  function miniCalendar() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/mini-calendar/mini-calendar.html',
      scope: {
        calendarHomeId: '='
      },
      replace: true,
      controller: 'miniCalendarController'
    };

    return directive;
  }

})();
