(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calExternalCalendarsList', {
      templateUrl: '/calendar/app/components/calendars-list/external-calendars-list/external-calendars-list.html',
      bindings: {
        sharedCalendars: '=',
        publicCalendars: '=',
        toggleCalendar: '=',
        hiddenCalendars: '='
      }
    });
})();
