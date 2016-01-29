'use strict';

angular.module('linagora.esn.contact')

  .factory('ContactLiveUpdate', function($rootScope, $log, livenotification, ContactAPIClient, ContactShellBuilder, CONTACT_EVENTS, CONTACT_WS) {
    var sio = null;
    var listening = false;

    function onCreate(data) {
      ContactShellBuilder.fromWebSocket(data).then(function(shell) {
        $rootScope.$broadcast(CONTACT_EVENTS.CREATED, shell);
      }, function() {
        $log.debug('Can not build the contact from websocket data');
      });
    }

    function onDelete(data) {
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, { id: data.contactId });
    }

    function onUpdate(data) {
      ContactAPIClient
        .addressbookHome(data.bookId)
        .addressbook(data.bookName)
        .vcard(data.contactId)
        .get()
        .then(function(updatedContact) {
          $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, updatedContact);
        }, function(err) {

        });
    }

    function startListen(bookId) {
      if (listening) { return; }

      if (sio === null) {
        sio = livenotification(CONTACT_WS.room, bookId);
      }
      sio.on(CONTACT_WS.events.CREATED, onCreate);
      sio.on(CONTACT_WS.events.DELETED, onDelete);
      sio.on(CONTACT_WS.events.UPDATED, onUpdate);

      listening = true;
      $log.debug('Start listening contact live update');
    }

    function stopListen() {
      if (!listening) { return; }

      if (sio) {
        sio.removeListener(CONTACT_WS.events.CREATED, onCreate);
        sio.removeListener(CONTACT_WS.events.DELETED, onDelete);
        sio.removeListener(CONTACT_WS.events.UPDATED, onUpdate);
      }

      listening = false;
      $log.debug('Stop listening contact live update');
    }

    return {
      startListen: startListen,
      stopListen: stopListen
    };
  });
