(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calWebsocketListenerService', calWebsocketListenerService);

  function calWebsocketListenerService(
    $q,
    livenotification,
    calCachedEventSource,
    calEventService,
    calendarEventEmitter,
    calMasterEventCache,
    CalendarShell,
    CAL_WEBSOCKET
  ) {

    return {
      listenEvents: listenEvents
    };

    function listenEvents() {
      var sio = livenotification(CAL_WEBSOCKET.NAMESPACE);

      sio.on(CAL_WEBSOCKET.EVENT.CREATED, _liveNotificationHandlerOnCreateRequestandUpdate);
      sio.on(CAL_WEBSOCKET.EVENT.REQUEST, _liveNotificationHandlerOnCreateRequestandUpdate);
      sio.on(CAL_WEBSOCKET.EVENT.CANCEL, _liveNotificationHandlerOnDelete);
      sio.on(CAL_WEBSOCKET.EVENT.UPDATED, _liveNotificationHandlerOnCreateRequestandUpdate);
      sio.on(CAL_WEBSOCKET.EVENT.DELETED, _liveNotificationHandlerOnDelete);
      sio.on(CAL_WEBSOCKET.EVENT.REPLY, _liveNotificationHandlerOnReply);

      return {
        clean: clean,
        sio: sio
      };

      function clean() {
        sio.removeListener(CAL_WEBSOCKET.EVENT.CREATED, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CAL_WEBSOCKET.EVENT.UPDATED, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CAL_WEBSOCKET.EVENT.DELETED, _liveNotificationHandlerOnDelete);
        sio.removeListener(CAL_WEBSOCKET.EVENT.REQUEST, _liveNotificationHandlerOnCreateRequestandUpdate);
        sio.removeListener(CAL_WEBSOCKET.EVENT.REPLY, _liveNotificationHandlerOnReply);
        sio.removeListener(CAL_WEBSOCKET.EVENT.CANCEL, _liveNotificationHandlerOnDelete);
      }

      function _liveNotificationHandlerOnCreateRequestandUpdate(msg) {
        var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        calCachedEventSource.registerUpdate(event);
        calMasterEventCache.save(event);
        calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
      }

      function _liveNotificationHandlerOnReply(msg) {
        var replyEvent = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});
        var event = calMasterEventCache.get(replyEvent.path);

        event && event.applyReply(replyEvent);

        $q.when(event || calEventService.getEvent(replyEvent.path)).then(function(event) {
          calMasterEventCache.save(event);
          calCachedEventSource.registerUpdate(event);
          calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
        });
      }

      function _liveNotificationHandlerOnDelete(msg) {
        var event = CalendarShell.from(msg.event, {etag: msg.etag, path: msg.eventPath});

        calCachedEventSource.registerDelete(event);
        calMasterEventCache.remove(event);
        calendarEventEmitter.fullcalendar.emitRemovedEvent(event);
      }
    }
  }
})();
