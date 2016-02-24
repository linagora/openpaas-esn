'use strict';

angular.module('esn.calendar').factory('keepChangeDuringGraceperiod', function($timeout, CALENDAR_GRACE_DELAY) {
  var changes = {};
  var DELETE = 'delete';
  var UPDATE = 'update';
  var ADD = 'add';

  function deleteRegistration(event) {
    if (!changes[event.id]) {
      return;
    }
    $timeout.cancel(changes[event.id].expirationPromise);
    delete(changes[event.id]);
  }

  function saveChange(action, event, calendarId) {
    var undo = deleteRegistration.bind(null, event);
    changes[event.id] = {
      expirationPromise: $timeout(undo, CALENDAR_GRACE_DELAY, false),
      event: event,
      calendarId: calendarId,
      action: action
    };

    return undo;
  }

  function resetChange() {
    changes = {};
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
      if (change.action === ADD && eventInPeriod(change.event) && change.calendarId === calendarId) {
        events.push(change.event);
      }
    });

    return events;
  }

  function wrapEventSource(calendarId, calendarSource) {
    return function(start, end, timezone, callback) {
      calendarSource(start, end, timezone, function(events) {
        callback(addAddedEvent(start, end, calendarId, applyUpdatedAndDeleteEvent(events)));
      });
    };
  }

  return {
    registerAdd: saveChange.bind(null, ADD),
    registerDelete: saveChange.bind(null, DELETE),
    registerUpdate: saveChange.bind(null, UPDATE),
    deleteRegistration: deleteRegistration,
    wrapEventSource: wrapEventSource,
    resetChange: resetChange
  };
});
