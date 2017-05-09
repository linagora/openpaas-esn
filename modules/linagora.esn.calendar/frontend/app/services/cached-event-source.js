(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calCachedEventSource', calCachedEventSource);

  function calCachedEventSource($q, _, calendarExploredPeriodService, calEventStore, CAL_CACHED_EVENT_SOURCE_ADD, CAL_CACHED_EVENT_SOURCE_DELETE, CAL_CACHED_EVENT_SOURCE_UPDATE) {
    var changes = {};

    var service = {
      registerAdd: saveChange.bind(null, CAL_CACHED_EVENT_SOURCE_ADD),
      registerDelete: saveChange.bind(null, CAL_CACHED_EVENT_SOURCE_DELETE),
      registerUpdate: saveChange.bind(null, CAL_CACHED_EVENT_SOURCE_UPDATE),
      resetCache: resetCache,
      deleteRegistration: deleteRegistration,
      wrapEventSource: wrapEventSource
    };

    return service;

    ////////////

    function deleteRegistration(event) {
      if (changes[event.id]) {
        (changes[event.id].instances || []).forEach(function(subEvent) {
          deleteRegistration(subEvent);
        });
        delete changes[event.id];
      }
    }

    function saveChange(action, event) {
      deleteRegistration(event);

      changes[event.id] = {
        added: new Date(),
        event: event,
        action: action,
        instances: []
      };

      return deleteRegistration.bind(null, event);
    }

    function expandRecurringChange(start, end) {
      angular.forEach(changes, function(change) {
        if (change.event.isRecurring() && (!change.expandedUntil || change.expandedUntil.isBefore(end) || !change.expandedFrom || change.expandedFrom.isAfter(start))) {
          change.instances = [];
          change.event.expand(start.clone().subtract(1, 'day'), end.clone().add(1, 'day')).forEach(function(subEvent) {
            saveChange(change.action, subEvent);
            change.instances.push(subEvent);
          });
          change.expandedUntil = end;
          change.expandedFrom = start;
        }
      });
    }

    function addAddedEvent(start, end, calendarUniqueId, events, customChanges) {
      function eventInPeriod(event) {
        return [event.start, event.end].some(function(date) {
          return date && date.clone().stripTime().isBetween(start, end, 'day', '[]');
        });
      }

      angular.forEach(customChanges || changes, function(change) {
        if (change.action === CAL_CACHED_EVENT_SOURCE_ADD && change.event.calendarUniqueId === calendarUniqueId && !change.event.isRecurring() && eventInPeriod(change.event)) {
          events.push(change.event);
        }
      });

      return events;
    }

    function applyUpdatedAndDeleteEvent(events, start, end, calendarUniqueId) {
      var notAppliedChange = _.chain(changes).omit(function(change) {
        return change.action !== CAL_CACHED_EVENT_SOURCE_UPDATE;
      }).mapValues(function(change) {
        var result = _.clone(change);

        result.action = CAL_CACHED_EVENT_SOURCE_ADD;

        return result;
      }).value();

      var result = events.reduce(function(previousCleanedEvents, event) {

        var change = changes[event.id];
        var changeInMaster = event.isInstance() && changes[event.uid];

        if (!change && !changeInMaster) {
          previousCleanedEvents.push(event);
        } else if (change && change.action === CAL_CACHED_EVENT_SOURCE_UPDATE) {
          delete notAppliedChange[event.id];
          if (change.event.isRecurring()) {
            change.instances.forEach(function(instance) {
              delete notAppliedChange[instance.id];
              previousCleanedEvents.push(instance);
            });
          } else {
            previousCleanedEvents.push(change.event);
          }
        }

        return previousCleanedEvents;
      }, []);

      return addAddedEvent(start, end, calendarUniqueId, result, notAppliedChange);
    }

    function applySavedChange(start, end, calendarUniqueId, events) {
      expandRecurringChange(start, end);

      return addAddedEvent(start, end, calendarUniqueId, applyUpdatedAndDeleteEvent(events, start, end, calendarUniqueId));
    }

    function fetchEventOnlyIfNeeded(start, end, timezone, calId, calendarSource) {
      var defer = $q.defer();
      var period = {start: start, end: end};

      if (calendarExploredPeriodService.getUnexploredPeriodsInPeriod(calId, period).length === 0) {
        defer.resolve(calEventStore.getInPeriod(calId, period));
      } else {
        calendarSource(start, end, timezone, function(events) {
          calendarExploredPeriodService.registerExploredPeriod(calId, period);
          events.map(calEventStore.save);
          defer.resolve(events);
        });
      }

      return defer.promise;
    }

    function wrapEventSource(calendarUniqueId, calendarSource) {
      return function(start, end, timezone, callback) {
        fetchEventOnlyIfNeeded(start, end, timezone, calendarUniqueId, calendarSource).then(function(events) {
          callback(applySavedChange(start, end, calendarUniqueId, events));
        });
      };
    }

    function resetCache() {
      changes = {};
      calEventStore.reset();
      calendarExploredPeriodService.reset();
    }
  }
})();
