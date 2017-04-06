(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarConfigurationTabMain', calendarConfigurationTabMain());

  ////////////

  function calendarConfigurationTabMain() {
    return {
      templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-tab-main/calendar-configuration-tab-main.html',
      bindings: {
        calendar: '=',
        calendarHomeId: '=',
        newCalendar: '=',
        publicSelection: '='
      },
      controller: 'CalendarConfigurationTabMainController'
    };
  }
})();
