'use strict';

angular.module('esn.calendar').factory('cachedEventSource', function($timeout, CALENDAR_GRACE_DELAY) {
  var changes = {};
  var DELETE = 'delete';
  var UPDATE = 'update';
  var ADD = 'add';

  function deleteRegistration(event) {
    if (changes[event.id]) {
      $timeout.cancel(changes[event.id].expirationPromise);
      delete(changes[event.id]);
    }
  }

  function saveChange(action, event, calendarId, createdSince) {
    var undo = deleteRegistration.bind(null, event);
    changes[event.id] = {
      expirationPromise: $timeout(undo, CALENDAR_GRACE_DELAY - (createdSince || 0), false),
      added: new Date(),
      event: event,
      calendarId: calendarId,
      action: action,
      instances: []
    };

    return undo;
  }

  function expandRecurringChange(start, end) {
    angular.forEach(changes, function(change) {
      if (change.event.isRecurring() && (!change.expandedUntil || change.expandedUntil.isBefore(end))) {
        change.event.expand(start.clone().subtract(1, 'day'), end.clone().add(1, 'day')).forEach(function(subEvent) {
          saveChange(change.action, subEvent, change.calendarId, ((new Date()).getTime() - change.added.getTime()));
          change.instances.push(subEvent);
        });
        change.expandedUntil = end;
      }
    });
  }

  function applyUpdatedAndDeleteEvent(events) {
    return events.reduce(function(previousCleanedEvents, event) {

      var change = changes[event.id];
      if (!change || change.action === ADD) {
        previousCleanedEvents.push(event);
      } else if (change.action === UPDATE) {
        if (change.event.isRecurring()) {
          change.instances.forEach(function(instance) {
            previousCleanedEvents.push(instance);
          });
        } else {
          previousCleanedEvents.push(change.event);
        }
      }

      return previousCleanedEvents;
    }, []);
  }

  function addAddedEvent(start, end, calendarId, events) {
    function eventInPeriod(event) {
      return [event.start, event.end].some(function(date) {
        return date && (date.isSame(start, 'day') || date.isAfter(start)) &&
          (date.isSame(end, 'day') || date.isBefore(end));
      });
    }

    angular.forEach(changes, function(change) {
      if (change.action === ADD && change.calendarId === calendarId && !change.event.isRecurring() && eventInPeriod(change.event)) {
        events.push(change.event);
      }
    });

    return events;
  }

  function wrapEventSource(calendarId, calendarSource) {
    return function(start, end, timezone, callback) {
      calendarSource(start, end, timezone, function(events) {
        expandRecurringChange(start, end);
        callback(addAddedEvent(start, end, calendarId, applyUpdatedAndDeleteEvent(events)));
      });
    };
  }

  function resetChange() {
    changes = {};
  }

  return {
    registerAdd: saveChange.bind(null, ADD),
    registerDelete: saveChange.bind(null, DELETE),
    registerUpdate: saveChange.bind(null, UPDATE),
    resetChange: resetChange,
    deleteRegistration: deleteRegistration,
    wrapEventSource: wrapEventSource
  };
}).factory('calendarExploredPeriodService', function(_) {

  var exploredCalsPeriods = {};

  function min(a, b) {
    return a.isBefore(b, 'day') ? a : b;
  }

  function max(a, b) {
    return a.isAfter(b, 'day') ? a : b;
  }

  function merge(a, b) {
    return {
      start: min(a.start, b.start),
      end: max(a.end, b.end)
    };
  }

  //return the part of a that is not in b
  function difference(a, b) {
    var result = [];

    if (a.start.isBefore(b.start, 'day')) {
      result.push({
        start: a.start,
        end: min(a.end, b.start.clone().subtract(1, 'day'))
      });
    }

    if (a.end.isAfter(b.end, 'day')) {
      result.push({
        start: max(a.start, b.end.clone().add(1, 'day')),
        end: a.end
      });
    }

    return result;
  }

  function periodAreConnected(a, b) {
    if (a.start.isAfter(b.start)) {
      return periodAreConnected(b, a);
    }

    return b.start.isBefore(a.end.clone().add(2, 'day'), 'day');
  }

  function getExploredPeriods(calId) {
    exploredCalsPeriods[calId] = exploredCalsPeriods[calId] || [];
    return exploredCalsPeriods[calId];
  }

  function registerExploredPeriod(calId, period) {
    var exploredPeriods = getExploredPeriods(calId);
    if (!exploredPeriods.length) {
      exploredPeriods.push(period);
      return;
    }

    var insertionIndex = 0;
    var numOfMergedPeriod = 0;

    exploredPeriods.forEach(function(exploredPeriod, i) {
      if (exploredPeriod.end.isBefore(period.start.clone().subtract(1, 'day'), 'day')) {
        insertionIndex = i + 1;
      } else if (periodAreConnected(exploredPeriod, period)) {
        period = merge(exploredPeriod, period);
        numOfMergedPeriod++;
      }
    });

    exploredPeriods.splice(insertionIndex, numOfMergedPeriod, period);
  }

  function reset(calId) {
    delete exploredCalsPeriods[calId];
  }

  function getUnexploredPeriodsInPeriod(calId, period) {
    var exploredPeriods = getExploredPeriods(calId);
    return exploredPeriods.reduce(function(prev, exploredPeriod) {
      return _.flatten(prev.map(function(unexploredPeriod) {
        return difference(unexploredPeriod, exploredPeriod);
      }));
    }, [period]);
  }

  return {
    registerExploredPeriod: registerExploredPeriod,
    reset: reset,
    getUnexploredPeriodsInPeriod: getUnexploredPeriodsInPeriod
  };
}).factory('eventStore', function(fcMoment, _) {
  var calStores = {};

  function getCalStore(calId) {
    calStores[calId] = calStores[calId] || {
      eventsSortedByStart: [],
      maxEventsSize: 0
    };
    return calStores[calId];
  }

  function save(calId, event) {
    var store = getCalStore(calId);
    var insertionIndex = _.sortedIndex(store.eventsSortedByStart, event, function(event) {
      return event.start.unix();
    });

    for (var i = insertionIndex; i < store.eventsSortedByStart.length && store.eventsSortedByStart[i].start.isSame(event.start); i++) {
      if (store.eventsSortedByStart[i] && store.eventsSortedByStart[i].id === event.id) {
        return;
      }
    }

    store.eventsSortedByStart.splice(insertionIndex, 0, event);

    var eventSize = event.end.unix() - event.start.unix();
    store.maxEventsSize = Math.max(store.maxEventsSize, eventSize);
  }

  function getInPeriod(calId, period) {
    var store = getCalStore(calId);
    var result = [];

    var indexOfFirstInEnlargedPeriod = _.sortedIndex(
        store.eventsSortedByStart,
        {
          start: period.start.clone().subtract(fcMoment.duration(store.maxEventsSize).add(1, 'day'))
        },
        function(event) {
          return event.start.unix();
        }
    );

    //pre filter for efficiency we take event that start after maxEventsSize + 24 hour before the start of the period
    //and that does not start after the end of the period
    for (var i = indexOfFirstInEnlargedPeriod; i < store.eventsSortedByStart.length && !store.eventsSortedByStart[i].start.isAfter(period.end, 'day'); i++) {
      result.push(store.eventsSortedByStart[i]);
    }

    result = result.filter(function(event) {
      var eventInPeriod = [event.start, event.end].some(function(date) {
        return date.isBetween(period.start.clone().subtract(1, 'day'), period.end.clone().add(1, 'day'), 'day');
      });
      var eventCoverPeriod = event.start.isBefore(period.start, 'day') && event.end.isAfter(period.end, 'day');
      return eventInPeriod || eventCoverPeriod;
    });

    return result;
  }

  function reset(calId) {
    delete calStores[calId];
  }

  return {
    save: save,
    getInPeriod: getInPeriod,
    reset: reset
  };
});
