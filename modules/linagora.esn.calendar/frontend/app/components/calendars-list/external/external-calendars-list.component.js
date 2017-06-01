(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calExternalCalendarsList', {
      templateUrl: '/calendar/app/components/calendars-list/external/external-calendars-list.html',
      bindings: {
        sharedCalendars: '=',
        publicCalendars: '=',
        toggleCalendar: '=',
        hiddenCalendars: '='
      }
    });
})();
