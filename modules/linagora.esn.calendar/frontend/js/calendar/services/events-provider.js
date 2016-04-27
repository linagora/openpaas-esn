'use strict';

angular.module('esn.calendar')
  .factory('eventsProvider', function($q, calendarService, newProvider) {
    return newProvider({
      name: 'Events',
      fetch: function() {
        return function() {
          return calendarService.searchEvents().then(function(events) {
            return events.map(function(event) {
              event.type = 'Events';
              return event;
            });
          });
        };
      },
      getDefaultContainer: function() { return $q.when(); },
      templateUrl: '/calendar/views/components/event-search-item'
    });
  });
