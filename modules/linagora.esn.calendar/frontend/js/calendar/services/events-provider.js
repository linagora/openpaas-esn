'use strict';

angular.module('esn.calendar')
  .factory('eventsProvider', function($q, moment, newProvider) {
    return newProvider({
      name: 'Events',
      fetch: function() {
        return function() {
          return $q.when([{
            title: 'Meeting with some people',
            start: moment(),
            end: moment().add(1, 'hour'),
            location: 'somewhere'
          }]);
        };
      },
      getDefaultContainer: function() { return $q.when(); },
      templateUrl: '/calendar/views/components/event-search-item'
    });
  });
