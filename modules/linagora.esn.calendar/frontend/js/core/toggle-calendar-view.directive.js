(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('toggleCalendarView', toggleCalendarView);

  toggleCalendarView.$inject = [
    'uiCalendarConfig',
    'calendarService'
  ];

  function toggleCalendarView(uiCalendarConfig, calendarService) {
    var directive = {
      restrict: 'A',
      scope: true,
      priority: 5555,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs) { // eslint-disable-line
      element.on('click', function() {
        uiCalendarConfig.calendars[calendarService.calendarHomeId].fullCalendar('changeView', attrs.toggleCalendarView);
      });
    }
  }

})();
