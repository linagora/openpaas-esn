(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarEventEmitter', calendarEventEmitter);

  calendarEventEmitter.$inject = [
    '$rootScope',
    'CALENDAR_EVENTS'
  ];

  function calendarEventEmitter($rootScope, CALENDAR_EVENTS) {
    var service = {
      activitystream: {
        emitPostedMessage: emitPostedMessage
      },
      fullcalendar: {
        emitCreatedEvent: emitCreatedEvent,
        emitRemovedEvent: emitRemovedEvent,
        emitModifiedEvent: emitModifiedEvent
      }
    };

    return service;

    ////////////

    function emitPostedMessage(messageId, activityStreamUuid) {
      $rootScope.$emit('message:posted', {
        activitystreamUuid: activityStreamUuid,
        id: messageId
      });
    }

    function emitCreatedEvent(shell) {
      $rootScope.$emit(CALENDAR_EVENTS.ITEM_ADD, shell);
    }

    function emitRemovedEvent(id) {
      $rootScope.$emit(CALENDAR_EVENTS.ITEM_REMOVE, id);
    }

    function emitModifiedEvent(shell) {
      $rootScope.$emit(CALENDAR_EVENTS.ITEM_MODIFICATION, shell);
    }
  }

})();
