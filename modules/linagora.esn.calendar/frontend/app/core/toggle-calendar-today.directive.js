(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('toggleCalendarToday', toggleCalendarToday);

  toggleCalendarToday.$inject = [
    'uiCalendarConfig',
    'calendarService'
  ];

  function toggleCalendarToday(uiCalendarConfig, calendarService) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs) { // eslint-disable-line
      element.on('click', function() {
        uiCalendarConfig.calendars[calendarService.calendarHomeId].fullCalendar('today');
      });
    }
  }

})();
