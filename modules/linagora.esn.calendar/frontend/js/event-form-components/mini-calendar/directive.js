'use strict';

angular.module('esn.calendar')

  .directive('miniCalendar', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/mini-calendar.html',
      scope: {
        calendarId: '='
      },
      controller: 'miniCalendarController'
    };
  })
  .directive('miniCalendarMobile', function($window, CALENDAR_EVENTS) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/mini-calendar.html',
      scope: {
        calendarId: '='
      },
      controller: 'miniCalendarController',
      link: function(scope, element) {

        scope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, function() {
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
    };
  });
