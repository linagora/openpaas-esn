(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarLeftPane', calendarLeftPane);

  calendarLeftPane.$inject = [
    'CALENDAR_EVENTS',
    'LEFT_PANEL_BOTTOM_MARGIN'
  ];

  function calendarLeftPane(CALENDAR_EVENTS, LEFT_PANEL_BOTTOM_MARGIN) {
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
      scope.$on(CALENDAR_EVENTS.CALENDAR_HEIGHT, function(event, height) { // eslint-disable-line
        element.height(height - LEFT_PANEL_BOTTOM_MARGIN);
      });
    }
  }

})();
