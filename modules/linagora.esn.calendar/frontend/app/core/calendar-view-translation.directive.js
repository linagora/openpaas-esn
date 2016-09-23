(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarViewTranslation', calendarViewTranslation);

  calendarViewTranslation.$inject = [
    '$rootScope',
    'CALENDAR_EVENTS'
  ];

  function calendarViewTranslation($rootScope, CALENDAR_EVENTS) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element, attrs) { // eslint-disable-line
      element.click(function() {
        var action = attrs.calendarViewTranslation;

        $rootScope.$broadcast(CALENDAR_EVENTS.VIEW_TRANSLATION, action);
      });
    }
  }

})();
