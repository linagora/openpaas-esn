(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calToggleMiniCalendar', calToggleMiniCalendar);

  function calToggleMiniCalendar($rootScope, CAL_EVENTS) {
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
        $rootScope.$broadcast(CAL_EVENTS.MINI_CALENDAR.TOGGLE);
      });
    }
  }

})();
