(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('miniCalendar', miniCalendar);

  miniCalendar.$inject = [
    'miniCalendarService'
  ];

  function miniCalendar(miniCalendarService) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/mini-calendar/mini-calendar.html',
      scope: {
        calendarHomeId: '='
      },
      link: link,
      replace: true,
      controller: 'miniCalendarController'
    };

    return directive;

    ////////////

    function link(scope, element) { // eslint-disable-line
      miniCalendarService.miniCalendarDesktopId = scope.miniCalendarId;
    }
  }

})();
