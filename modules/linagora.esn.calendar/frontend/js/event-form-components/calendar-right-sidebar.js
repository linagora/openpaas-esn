'use strict';

angular.module('esn.calendar')
  .directive('toggleRightSidebarCalendarButton', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/toggle-right-sidebar-calendar-button.html'
    }
  });
