'use strict';

angular.module('esn.calendar')
  .factory('eventsProvider', function($q, session, calendarService, newProvider, ELEMENTS_PER_REQUEST) {
    return newProvider({
      name: 'Events',
      fetch: function(context) {
        var offset = 0;
        return function() {
          var context = {
            query: context,
            offset: offset,
            limit: ELEMENTS_PER_REQUEST
          };
          return calendarService.searchEvents(session.user._id, context)
            .then(function(events) {
              offset += events.length;
              return events;
            })
            .then(function(events) {
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
