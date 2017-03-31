(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calToggleView', calToggleView);

  function calToggleView(CAL_EVENTS, $rootScope) {
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
        $rootScope.$broadcast(CAL_EVENTS.CALENDARS.TOGGLE_VIEW_MODE, attrs.calToggleView);
      });
    }
  }
})();
