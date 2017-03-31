(function() {
  'use strict';

  angular.module('esn.calendar')
     .component('calEventSearchCard', {
       templateUrl: '/calendar/app/search/event/event-search-card.html',
       bindings: {
         event: '<',
         start: '<',
         end: '<'
       }
    });
})();
