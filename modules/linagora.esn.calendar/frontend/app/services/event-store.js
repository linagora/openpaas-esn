(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calEventStore', calEventStore);

  function calEventStore(_, calMoment) {
    var calStores = {};

    var service = {
      save: save,
      getInPeriod: getInPeriod,
      reset: reset
    };

    return service;

    ////////////

    function getCalStore(calId) {
      calStores[calId] = calStores[calId] || {
        eventsSortedByStart: [],
        maxEventsDuration: 0
      };

      return calStores[calId];
    }

    function save(event) {
      var store = getCalStore(event.calendarUniqueId);
      var insertionIndex = _.sortedIndex(store.eventsSortedByStart, event, function(event) {
        return event.start.unix();
      });

      for (var i = insertionIndex; i < store.eventsSortedByStart.length && store.eventsSortedByStart[i].start.isSame(event.start); i++) {
        if (store.eventsSortedByStart[i] && store.eventsSortedByStart[i].id === event.id) {
          return;
        }
      }

      store.eventsSortedByStart.splice(insertionIndex, 0, event);

      var eventDuration = event.end.unix() - event.start.unix();

      store.maxEventsDuration = Math.max(store.maxEventsDuration, eventDuration);
    }

    function getInPeriod(calId, period) {
      var store = getCalStore(calId);
      var result = [];

      var indexOfFirstInEnlargedPeriod = _.sortedIndex(
          store.eventsSortedByStart,
          {
            start: period.start.clone().subtract(calMoment.duration(store.maxEventsDuration).add(1, 'day'))
          },
          function(event) {
            return event.start.unix();
          }
      );

      //pre filter for efficiency we take event that start after maxEventsDuration + 24 hour before the start of the period
      //and that does not start after the end of the period
      for (var i = indexOfFirstInEnlargedPeriod; i < store.eventsSortedByStart.length && !store.eventsSortedByStart[i].start.isAfter(period.end, 'day'); i++) {
        result.push(store.eventsSortedByStart[i]);
      }

      result = result.filter(function(event) {
        var isEventInPeriod = [event.start, event.end].some(function(date) {
          return date.isBetween(period.start.clone().subtract(1, 'day'), period.end.clone().add(1, 'day'), 'day');
        });
        var isEventCoverPeriod = event.start.isBefore(period.start, 'day') && event.end.isAfter(period.end, 'day');

        return isEventInPeriod || isEventCoverPeriod;
      });

      return result;
    }

    function reset(calId) {
      if (calId) {
        delete calStores[calId];
      } else {
        calStores = {};
      }
    }
  }
})();
