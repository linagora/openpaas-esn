'use strict';

angular.module('esn.calendar')
  .factory('eventsProvider', function($q, calendarService, newProvider) {
    return newProvider({
      name: 'Events',
      fetch: function(context) {
        return function() {
          return calendarService.searchEvents(context).then(function(events) {
            return events.map(function(event) {
              event.type = 'Events';
              return event;
            });
          });
        };
      },
      getDefaultContext: function(context) { return $q.when(context); },
      templateUrl: '/calendar/views/components/event-search-item'
    });
  });
