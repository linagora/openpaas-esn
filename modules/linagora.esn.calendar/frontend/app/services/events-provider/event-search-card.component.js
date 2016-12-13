(function() {
  'use strict';

  angular.module('esn.calendar')
     .component('calEventSearchCard', {
       templateUrl: '/calendar/app/services/events-provider/event-search-card.html',
       bindings: {
         event: '<',
         start: '<',
         end: '<'
       }
    });
})();
