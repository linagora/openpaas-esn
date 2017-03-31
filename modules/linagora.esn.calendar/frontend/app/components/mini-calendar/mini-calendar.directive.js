(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('miniCalendarMobile', miniCalendarMobile);

  function miniCalendarMobile($window, miniCalendarService, CAL_EVENTS) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/mini-calendar/mini-calendar.html',
      scope: {
        calendarHomeId: '='
      },
      link: link,
      replace: true,
      controller: 'miniCalendarController'
    };

    return directive;

    ////////////

    function link(scope, element) { // eslint-disable-line
      scope.$on(CAL_EVENTS.MINI_CALENDAR.TOGGLE, function() {
        // initial-state is invisible and height: 0 so that the mini-calendar is not
        // expanded yet
        element.removeClass('initial-state');
        // This is used for slideToggle with jQuery.
        element.addClass('display-none');
        element.stop(true, false).slideToggle(200, function() {
          angular.element($window).trigger('resize');
        });
      });
    }
  }

})();
