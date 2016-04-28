'use strict';

angular.module('esn.calendar')
  .factory('eventsProvider', function($q, session, calendarService, newProvider) {
    return newProvider({
      name: 'Events',
      fetch: function(context) {
        return function() {
          return calendarService.searchEvents(session.user._id, context).then(function(events) {
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
