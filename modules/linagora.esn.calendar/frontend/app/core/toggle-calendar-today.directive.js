(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calToggleToday', calToggleToday);

  function calToggleToday(CAL_EVENTS, $rootScope) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs) { // eslint-disable-line
      element.on('click', function() {
        $rootScope.$broadcast(CAL_EVENTS.CALENDARS.TODAY);
      });
    }
  }

})();
