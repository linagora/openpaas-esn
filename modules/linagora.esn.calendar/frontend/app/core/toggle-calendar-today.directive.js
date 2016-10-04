(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('toggleCalendarToday', toggleCalendarToday);

  toggleCalendarToday.$inject = [
    'CALENDAR_EVENTS',
    '$rootScope'
  ];

  function toggleCalendarToday(CALENDAR_EVENTS, $rootScope) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs) { // eslint-disable-line
      element.on('click', function() {
        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.TODAY);
      });
    }
  }

})();
