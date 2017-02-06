(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarSubHeader', calendarSubHeader);

  function calendarSubHeader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendar/calendar-header/calendar-sub-header.html',
      replace: true,
      controller: 'calendarSubHeaderController'
    };

    return directive;
  }
})();
