'use strict';

angular.module('esn.calendar').factory('keepChangeDuringGraceperiod', function($timeout, CALENDAR_GRACE_DELAY) {
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
      action: action
    };

    return undo;
  }

  function expandRecurringChange(start, end) {
    angular.forEach(changes, function(change) {
      if (change.event.isRecurring() && (!change.expandedUntil || change.expandedUntil.isBefore(end))) {
        change.event.expand(start, end.add(1, 'day')).forEach(function(subEvent) {
          saveChange(change.action, subEvent, change.calendarId, ((new Date()).getTime() - change.added.getTime()));
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
        previousCleanedEvents.push(change.event);
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
});
