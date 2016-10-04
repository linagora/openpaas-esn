(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarCommunityButtonToolbar', calendarCommunityButtonToolbar);

  function calendarCommunityButtonToolbar() {
    var directive = {
      restrict: 'A',
      templateUrl: '/calendar/app/calendar/calendar-community-button-toolbar/calendar-community-button-toolbar.html',
      replace: true
    };

    return directive;
  }

})();
