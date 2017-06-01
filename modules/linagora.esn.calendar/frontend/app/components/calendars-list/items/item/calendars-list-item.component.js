(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calCalendarsListItem', {
      templateUrl: '/calendar/app/components/calendars-list/items/item/calendars-list-item.html',
      controller: 'CalendarsListItemController',
      bindings: {
        calendar: '<',
        onOptionClick: '&',
        onShowHideToggle: '&',
        selected: '<',
        showDetails: '<'
      }
    });
})();
