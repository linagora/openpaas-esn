(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarButtonToolbar', calendarButtonToolbar);

  function calendarButtonToolbar() {
    var directive = {
      restrict: 'A',
      templateUrl: '/calendar/views/calendar/community-calendar-button-toolbar.html',
      replace: true
    };

    return directive;
  }

})();
