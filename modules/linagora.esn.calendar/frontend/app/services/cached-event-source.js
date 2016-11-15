(function() {
  'use strict';

  angular.module('esn.calendar')
         .constant('CACHED_EVENT_SOURCE_ADD', 'add')
         .constant('CACHED_EVENT_SOURCE_DELETE', 'delete')
         .constant('CACHED_EVENT_SOURCE_UPDATE', 'update')
         .factory('calCachedEventSource', calCachedEventSource);

  calCachedEventSource.$inject = [
    '$q',
    '_',
    'calendarExploredPeriodService',
    'calEventStore',
    'CACHED_EVENT_SOURCE_ADD',
    'CACHED_EVENT_SOURCE_DELETE',
    'CACHED_EVENT_SOURCE_UPDATE',
    'CALENDAR_GRACE_DELAY'
  ];

  function calCachedEventSource($q, _, calendarExploredPeriodService, calEventStore, CACHED_EVENT_SOURCE_ADD, CACHED_EVENT_SOURCE_DELETE, CACHED_EVENT_SOURCE_UPDATE) {
    var changes = {};

    var service = {
      registerAdd: saveChange.bind(null, CACHED_EVENT_SOURCE_ADD),
      registerDelete: saveChange.bind(null, CACHED_EVENT_SOURCE_DELETE),
      registerUpdate: saveChange.bind(null, CACHED_EVENT_SOURCE_UPDATE),
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

          change.event.expand(start.clone().subtract(1, 'day'), end.clone().add(1, 'day')).forEach(function(subEvent) {
            saveChange(change.action, subEvent);
            change.instances.push(subEvent);
          });
          change.expandedUntil = end;
          change.expandedFrom = start;
        }
      });
    }

    function addAddedEvent(start, end, calendarId, events, customChanges) {
      function eventInPeriod(event) {
        return [event.start, event.end].some(function(date) {
          return date && date.clone().stripTime().isBetween(start, end, 'day', '[]');
        });
      }

      angular.forEach(customChanges || changes, function(change) {
        if (change.action === CACHED_EVENT_SOURCE_ADD && change.event.calendarId === calendarId && !change.event.isRecurring() && eventInPeriod(change.event)) {
          events.push(change.event);
        }
      });

      return events;
    }

    function applyUpdatedAndDeleteEvent(events, start, end, calendarId) {
      var notAppliedChange = _.chain(changes).omit(function(change) {
        return change.action !== CACHED_EVENT_SOURCE_UPDATE;
      }).mapValues(function(change) {
        var result = _.clone(change);

        result.action = CACHED_EVENT_SOURCE_ADD;

        return result;
      }).value();

      var result = events.reduce(function(previousCleanedEvents, event) {

        var change = changes[event.id];
        var changeInMaster = event.isInstance() && changes[event.uid];

        if (!change && !changeInMaster) {
          previousCleanedEvents.push(event);
        } else if (change && change.action === CACHED_EVENT_SOURCE_UPDATE) {
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

    function wrapEventSource(calendarId, calendarSource) {
      return function(start, end, timezone, callback) {
        fetchEventOnlyIfNeeded(start, end, timezone, calendarId, calendarSource).then(function(events) {
          callback(applySavedChange(start, end, calendarId, events));
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
