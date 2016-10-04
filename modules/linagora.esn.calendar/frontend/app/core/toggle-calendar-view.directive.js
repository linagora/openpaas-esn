(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('toggleCalendarView', toggleCalendarView);

  toggleCalendarView.$inject = [
    'CALENDAR_EVENTS',
    '$rootScope'
  ];

  function toggleCalendarView(CALENDAR_EVENTS, $rootScope) {
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
        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, attrs.toggleCalendarView);
      });
    }
  }
})();
