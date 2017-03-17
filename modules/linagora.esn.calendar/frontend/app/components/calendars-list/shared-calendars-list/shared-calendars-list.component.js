(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calSharedCalendarsList', {
      templateUrl: '/calendar/app/components/calendars-list/shared-calendars-list/shared-calendars-list.html',
      bindings: {
        sharedCalendars: '=',
        toggleCalendar: '=',
        hiddenCalendars: '='
      }
    });
})();
