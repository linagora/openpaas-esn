'use strict';

angular.module('esn.calendar')
  .factory('eventsProviders', function($log, $q, calendarService, calendarHomeService, newProvider, ELEMENTS_PER_REQUEST) {
    function buildProvider(calendar) {
      var name = 'Events from ' + calendar.name;
      return newProvider({
        name: name,
        fetch: function(query) {
          var offset = 0;

          function _setRelevance(event) {
            event.date = event.start;
          }

          return function() {
            var context = {
              query: query,
              offset: offset,
              limit: ELEMENTS_PER_REQUEST
            };
            return calendarService.searchEvents(calendar.id, context)
              .then(function(events) {
                offset += events.length;
                return events.map(function(event) {
                  event.type = name;
                  _setRelevance(event);
                  return event;
                });
              });
          };
        },
        buildFetchContext: function(options) { return $q.when(options.query); },
        templateUrl: '/calendar/views/components/event-search-item'
      });
    }

    function getAll() {
      return calendarHomeService.getUserCalendarHomeId().then(function(calendarHomeId) {
        return calendarService.listCalendars(calendarHomeId);
      }).then(function(calendars) {
        return calendars.map(buildProvider);
      }, function(error) {
        $log.error('Could not register search providers for calendar module', error);
        return [];
      });
    }

    function getForCalendar(calendar) {
      return buildProvider(calendar);
    }

    return {
      getAll: getAll,
      getForCalendar: getForCalendar
    };
  });
