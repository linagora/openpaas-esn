(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calUserCalendarsList', {
      templateUrl: '/calendar/app/components/calendars-list/user-calendars-list/user-calendars-list.html',
      bindings: {
        userCalendars: '=',
        toggleCalendar: '=',
        selectCalendar: '=',
        hiddenCalendars: '='
      }
    });
})();
