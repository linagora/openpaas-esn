(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarEventEmitter', calendarEventEmitter);

  function calendarEventEmitter($rootScope, CAL_EVENTS) {
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
      $rootScope.$emit(CAL_EVENTS.ITEM_ADD, shell);
    }

    function emitRemovedEvent(id) {
      $rootScope.$emit(CAL_EVENTS.ITEM_REMOVE, id);
    }

    function emitModifiedEvent(shell) {
      $rootScope.$emit(CAL_EVENTS.ITEM_MODIFICATION, shell);
    }
  }

})();
