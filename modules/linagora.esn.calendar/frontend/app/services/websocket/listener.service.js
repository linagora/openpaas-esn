(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calWebsocketListenerService', calWebsocketListenerService);

  function calWebsocketListenerService(
    $q,
    $log,
    livenotification,
    calCachedEventSource,
    calEventService,
    calPathParser,
    calendarEventEmitter,
    calendarService,
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
      sio.on(CAL_WEBSOCKET.CALENDAR.CREATED, _onCalendarCreated);
      sio.on(CAL_WEBSOCKET.CALENDAR.UPDATED, _onCalendarUpdated);
      sio.on(CAL_WEBSOCKET.CALENDAR.DELETED, _onCalendarDeleted);

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
        sio.removeListener(CAL_WEBSOCKET.CALENDAR.CREATED, _onCalendarCreated);
        sio.removeListener(CAL_WEBSOCKET.CALENDAR.UPDATED, _onCalendarUpdated);
        sio.removeListener(CAL_WEBSOCKET.CALENDAR.DELETED, _onCalendarDeleted);
      }

      function _onCalendarCreated(msg) {
        $log.debug('Received a new calendar', msg);
        var calendarPath = calPathParser.parseCalendarPath(msg.calendarPath);

        calendarService.getCalendar(calendarPath.calendarHomeId, calendarPath.calendarId).then(function(calendarCollectionShell) {
          if (calendarCollectionShell) {
            calendarService.addAndEmit(calendarPath.calendarHomeId, calendarCollectionShell);
          }

        }).catch(function(err) {
          $log.error('Can not get the new calendar', err);
        });
      }

      function _onCalendarDeleted(msg) {
        $log.debug('Calendar deleted', msg);
        var calendarPath = calPathParser.parseCalendarPath(msg.calendarPath);

        calendarService.removeAndEmit(calendarPath.calendarHomeId, {id: calendarPath.calendarId});
      }

      function _onCalendarUpdated(msg) {
        $log.debug('Calendar updated', msg);
        var calendarPath = calPathParser.parseCalendarPath(msg.calendarPath);

        calendarService.getCalendar(calendarPath.calendarHomeId, calendarPath.calendarId).then(function(calendarCollectionShell) {
          if (calendarCollectionShell) {
            calendarService.updateAndEmit(calendarPath.calendarHomeId, calendarCollectionShell);
          }

        }).catch(function(err) {
          $log.error('Can not get the updated calendar', err);
        });
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
