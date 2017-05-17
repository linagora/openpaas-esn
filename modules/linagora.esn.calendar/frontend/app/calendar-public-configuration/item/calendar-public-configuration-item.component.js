'use strict';

angular.module('esn.calendar')
  .component('calCalendarPublicConfigurationItem', {
    bindings: {
      item: '='
    },
    controller: 'CalCalendarPublicConfigurationItemController',
    templateUrl: '/calendar/app/calendar-public-configuration/item/calendar-public-configuration-item.html',
  });
