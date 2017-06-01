(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calendarsListItems', {
      templateUrl: '/calendar/app/components/calendars-list/calendars-list-items/calendars-list-items.html',
      controller: 'CalendarsListItemsController',
      bindings: {
        calendars: '=?',
        toggleCalendar: '=?',
        hiddenCalendars: '=?',
        stateToGo: '=?',
        showDetails: '=?'
      }
    });
})();
