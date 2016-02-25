'use strict';

angular.module('esn.calendar').factory('calendarEventEmitter', function($rootScope, CALENDAR_EVENTS) {
  return {
    activitystream: {
      emitPostedMessage: function(messageId, activityStreamUuid) {
        $rootScope.$emit('message:posted', {
          activitystreamUuid: activityStreamUuid,
          id: messageId
        });
      }
    },
    fullcalendar: {
      emitCreatedEvent: function(shell) {
        $rootScope.$emit(CALENDAR_EVENTS.ITEM_ADD, shell);
      },
      emitRemovedEvent: function(id) {
        $rootScope.$emit(CALENDAR_EVENTS.ITEM_REMOVE, id);
      },
      emitModifiedEvent: function(shell) {
        $rootScope.$emit(CALENDAR_EVENTS.ITEM_MODIFICATION, shell);
      }
    }
  };
});
