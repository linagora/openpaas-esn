(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarView', calendarView);

  calendarView.$inject = [
    '$rootScope',
    '$timeout'
  ];

  function calendarView($rootScope, $timeout) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendar/calendar-view/calendar-view.html',
      scope: {
        calendarHomeId: '=',
        uiConfig: '='
      },
      link: link,
      controller: 'calendarViewController'
    };

    return directive;

    ////////////

    function link(scope, element) {
      /*
       * Hiding the header in mobile first template does not work well with FullCalendar
       * because it needs a div :visible to be initialized. This visibility is gotten beacause
       * the header has a certain height. To have a css close solution, in css element.find('.calendar')
       * height is forced to 1px, and element.find('.fc-toolbar') is .hidden-xs. We then should reset
       * the element.find('.calendar') height to auto to have original value.
       */
      $timeout(function() {
        element.find('.calendar').css('height', 'auto');
      }, 0);

      $rootScope.$broadcast('header:disable-scroll-listener', true);
      scope.$on('$destroy', function() {
        $rootScope.$broadcast('header:disable-scroll-listener', false);
      });
    }
  }

})();
