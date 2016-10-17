(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calToggleMiniCalendar', calToggleMiniCalendar);

  calToggleMiniCalendar.$inject = [
    '$rootScope',
    'CALENDAR_EVENTS'
  ];

  function calToggleMiniCalendar($rootScope, CALENDAR_EVENTS) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs) { // eslint-disable-line
      element.click(function() {
        element.toggleClass('toggled');
        $rootScope.$broadcast(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
      });
    }
  }

})();
