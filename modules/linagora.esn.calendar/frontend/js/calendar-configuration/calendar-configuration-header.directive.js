(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarConfigurationHeader', calendarConfigurationHeader);

  function calendarConfigurationHeader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/views/calendar-configuration/calendar-configuration-header.html',
      replace: true
    };

    return directive;
  }

})();
