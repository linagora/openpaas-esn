'use strict';

angular.module('esn.calendar').factory('cachedEventSource', function($timeout, $q, CALENDAR_GRACE_DELAY, eventStore, calendarExploredPeriodService, _) {
  var changes = {};
  var DELETE = 'delete';
  var UPDATE = 'update';
  var ADD = 'add';

  function deleteRegistration(event) {
    delete(changes[event.id]);
  }

  function saveChange(action, event, calendarId, createdSince) {
    changes[event.id] = {
      added: new Date(),
      event: event,
      calendarId: calendarId,
      action: action,
      instances: []
    };

    return deleteRegistration.bind(null, event);
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

  function addAddedEvent(start, end, calendarId, events, customChanges) {
    function eventInPeriod(event) {
      return [event.start, event.end].some(function(date) {
        return date && (date.isSame(start, 'day') || date.isAfter(start)) &&
          (date.isSame(end, 'day') || date.isBefore(end));
      });
    }

    angular.forEach(customChanges || changes, function(change) {
      if (change.action === ADD && change.calendarId === calendarId && !change.event.isRecurring() && eventInPeriod(change.event)) {
        events.push(change.event);
      }
    });

    return events;
  }

  function applyUpdatedAndDeleteEvent(events, start, end, calendarId) {
    var notAppliedChange = _.chain(changes).omit(function(change) {
      return change.action !== UPDATE;
    }).mapValues(function(event) {
      var result = _.clone(event);
      result.action = ADD;
      return result;
    }).value();

    var result = events.reduce(function(previousCleanedEvents, event) {

      var change = changes[event.id];
      var changeInMaster = event.isInstance() && changes[event.uid];

      if (!change && !changeInMaster) {
        previousCleanedEvents.push(event);
      } else if (change && change.action === UPDATE) {
        delete notAppliedChange[event.id];
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

    return addAddedEvent(start, end, calendarId, result, notAppliedChange);
  }

  function applySavedChange(start, end, calendarId, events) {
    expandRecurringChange(start, end);
    return addAddedEvent(start, end, calendarId, applyUpdatedAndDeleteEvent(events, start, end, calendarId));
  }

  function fetchEventOnlyIfNeeded(start, end, timezone, calId, calendarSource) {
    var defer = $q.defer();
    var period = {start: start, end: end};

    if (calendarExploredPeriodService.getUnexploredPeriodsInPeriod(calId, period).length === 0) {
      defer.resolve(eventStore.getInPeriod(calId, period));
    } else {
      calendarSource(start, end, timezone, function(events) {
        calendarExploredPeriodService.registerExploredPeriod(calId, period);
        events.map(eventStore.save.bind(eventStore, calId));
        defer.resolve(events);
      });
    }

    return defer.promise;
  }

  function wrapEventSource(calendarId, calendarSource) {
    return function(start, end, timezone, callback) {
      fetchEventOnlyIfNeeded(start, end, timezone, calendarId, calendarSource).then(function(events) {
        callback(applySavedChange(start, end, calendarId, events));
      });
    };
  }

  function resetCache() {
    changes = {};
    eventStore.reset();
    calendarExploredPeriodService.reset();
  }

  return {
    registerAdd: saveChange.bind(null, ADD),
    registerDelete: saveChange.bind(null, DELETE),
    registerUpdate: saveChange.bind(null, UPDATE),
    resetCache: resetCache,
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
    if (calId) {
      delete exploredCalsPeriods[calId];
    } else {
      exploredCalsPeriods = {};
    }
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
      maxEventsDuration: 0
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

    var eventDuration = event.end.unix() - event.start.unix();
    store.maxEventsDuration = Math.max(store.maxEventsDuration, eventDuration);
  }

  function getInPeriod(calId, period) {
    var store = getCalStore(calId);
    var result = [];

    var indexOfFirstInEnlargedPeriod = _.sortedIndex(
        store.eventsSortedByStart,
        {
          start: period.start.clone().subtract(fcMoment.duration(store.maxEventsDuration).add(1, 'day'))
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

  return {
    save: save,
    getInPeriod: getInPeriod,
    reset: reset
  };
});
