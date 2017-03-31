(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calendarViewTranslation', calendarViewTranslation);

  function calendarViewTranslation($rootScope, CAL_EVENTS) {
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

        $rootScope.$broadcast(CAL_EVENTS.VIEW_TRANSLATION, action);
      });
    }
  }

})();
