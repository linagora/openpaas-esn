(function() {
  'use strict';

  angular
    .module('esn.calendar')
    .component('calendarTodayButton', {
      bindings: {
        isCurrentViewAroundToday: '&'
      },
      templateUrl: '/calendar/app/components/calendar-today-button/calendar-today-button.html',
      controller: 'CalendarTodayButtonController'
    });
})();
