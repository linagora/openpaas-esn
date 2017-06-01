(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calUserCalendarsList', {
      templateUrl: '/calendar/app/components/calendars-list/user/user-calendars-list.html',
      bindings: {
        userCalendars: '=',
        toggleCalendar: '=',
        hiddenCalendars: '='
      }
    });
})();
