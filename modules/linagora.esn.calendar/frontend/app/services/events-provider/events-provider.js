(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('eventsProviders', eventsProviders);

  eventsProviders.$inject = [
    '$log',
    '$q',
    '$rootScope',
    'calendarHomeService',
    'calendarService',
    'eventService',
    'newProvider',
    'searchProviders',
    'CALENDAR_EVENTS',
    'ELEMENTS_PER_REQUEST'
  ];

  function eventsProviders($log, $q, $rootScope, calendarHomeService, calendarService, eventService, newProvider, searchProviders, CALENDAR_EVENTS, ELEMENTS_PER_REQUEST) {
    var service = {
      setUpSearchProviders: setUpSearchProviders,
      getAll: getAll,
      getForCalendar: getForCalendar
    };

    return service;

    ////////////

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

            return eventService.searchEvents(calendar.id, context)
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
        templateUrl: '/calendar/app/services/events-provider/event-search-item'
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

    function setUpSearchProviders() {
      searchProviders.add(getAll());

      $rootScope.$on(CALENDAR_EVENTS.CALENDARS.ADD, function(event, calendar) { // eslint-disable-line
        searchProviders.add(getForCalendar(calendar));
      });
    }
  }

})();
