(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calendarLeftPane', calendarLeftPane);

  function calendarLeftPane(CAL_EVENTS, CAL_LEFT_PANEL_BOTTOM_MARGIN) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendar/calendar-left-pane/calendar-left-pane.html',
      scope: {
        calendarHomeId: '='
      },
      replace: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element) {
      scope.$on(CAL_EVENTS.CALENDAR_HEIGHT, function(event, height) { // eslint-disable-line
        element.height(height - CAL_LEFT_PANEL_BOTTOM_MARGIN);
      });
    }
  }

})();
