(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calToggleToday', calToggleToday);

  calToggleToday.$inject = [
    'CALENDAR_EVENTS',
    '$rootScope'
  ];

  function calToggleToday(CALENDAR_EVENTS, $rootScope) {
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
