(function() {
  'use strict';

  angular.module('esn.calendar')
         .constant('MINI_CALENDAR_DAY_FORMAT', 'YYYY-MM-DD')
         .factory('miniCalendarService', miniCalendarService);

  miniCalendarService.$inject = [
    '$q',
    '_',
    'fcMoment',
    'MINI_CALENDAR_DAY_FORMAT'
  ];

  function miniCalendarService($q, _, fcMoment, MINI_CALENDAR_DAY_FORMAT) {
    var service = {
      forEachDayOfEvent: forEachDayOfEvent,
      getWeekAroundDay: getWeekAroundDay,
      miniCalendarWrapper: miniCalendarWrapper
    };

    return service;

    ////////////


    function forEachDayOfEvent(event, callback) {
      var day = fcMoment(event.start);
      var end = fcMoment(event.end || event.start);

      if (!(event.allDay && event.end)) {
        end.add(1, 'days');
      }
      while (!day.isSame(end, 'day')) {
        callback(fcMoment(day));
        day.add(1, 'days');
      }
    }

    function getWeekAroundDay(calendarConfig, day) {
      var firstDay = calendarConfig.firstDay;

      //if no firstDay default in config, I assume local of moment
      //is the same as fullcalendar local for first day of the week
      var firstWeekDay = firstDay ?
        fcMoment(day).isoWeekday(firstDay) : fcMoment(day).weekday(0);

      if (firstWeekDay.isAfter(day)) {
        firstWeekDay.subtract(7, 'days');
      }

      var nextFirstWeekDay = fcMoment(firstWeekDay).add(7, 'days');

      return {
        firstWeekDay: firstWeekDay,
        nextFirstWeekDay: nextFirstWeekDay
      };
    }

    function miniCalendarWrapper(calendar, eventSources) {
      var originalEvents = {};
      var fakeEvents = {};

      function addOrDeleteEvent(add, event) {

        if (add) {
          originalEvents[event.id] = {
            id: event.id,
            start: fcMoment(event.start),
            end: event.end && fcMoment(event.end),
            allDay: event.allDay
          };
        } else {
          delete originalEvents[event.id];
        }

        forEachDayOfEvent(event, function(day) {
          var date = day.format(MINI_CALENDAR_DAY_FORMAT);
          var dayEvent = fakeEvents[date];

          if (!dayEvent) {
            dayEvent = fakeEvents[date] = {
              start: date,
              id: date,
              _num: 0,
              allDay: true
            };
          }

          dayEvent._num = dayEvent._num + (add ? 1 : -1);
          dayEvent.title = dayEvent._num > 99 ? '99+' : ('' + dayEvent._num);
        });
      }

      function groupByDayEventSources(start, end, timezone, callback) {
        var eventsPromise = [];

        originalEvents = {};
        fakeEvents = {};
        eventSources.forEach(function(calendarEventSource) {
          var deferred = $q.defer();

          eventsPromise.push(deferred.promise);
          calendarEventSource(start, end, timezone, deferred.resolve);
        });

        $q.all(eventsPromise).then(function(listOfEvents) {
          _.flatten(listOfEvents).forEach(addOrDeleteEvent.bind(null, true));
          calendar.fullCalendar('removeEvents');
          callback(_.values(fakeEvents));
        });
      }

      calendar.fullCalendar('addEventSource', {
        events: groupByDayEventSources
      });

      function rerender() {
        calendar.fullCalendar('refetchEvents');
      }

      return {
        rerender: rerender
      };
    }
  }

})();
