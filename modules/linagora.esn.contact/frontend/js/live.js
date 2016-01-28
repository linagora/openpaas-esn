'use strict';

angular.module('linagora.esn.contact')

  .factory('ContactLiveUpdate', function($rootScope, $log, livenotification, ContactAPIClient, ContactShell, ContactShellBuilder, ICAL, CONTACT_EVENTS, CONTACT_SIO_EVENTS) {
    var sio = null;
    var listening = false;

    function liveNotificationHandlerOnCreate(data) {
      ContactShellBuilder.fromWebSocket(data).then(function(shell) {
        $rootScope.$broadcast(CONTACT_EVENTS.CREATED, shell);
      }, function() {
        $log.debug('Can not build the contact from websocket data');
      });
    }

    function liveNotificationHandlerOnDelete(data) {
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, { id: data.contactId });
    }

    function liveNotificationHandlerOnUpdate(data) {
      ContactAPIClient
        .addressbookHome(data.bookId)
        .addressbook(data.bookName)
        .vcard(data.contactId)
        .get()
        .then(function(updatedContact) {
          $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, updatedContact);
        });
    }

    function startListen(bookId) {
      if (listening) { return; }

      if (sio === null) {
        sio = livenotification('/contacts', bookId);
      }
      sio.on(CONTACT_SIO_EVENTS.CREATED, liveNotificationHandlerOnCreate);
      sio.on(CONTACT_SIO_EVENTS.DELETED, liveNotificationHandlerOnDelete);
      sio.on(CONTACT_SIO_EVENTS.UPDATED, liveNotificationHandlerOnUpdate);

      listening = true;
      $log.debug('Start listening contact live update');
    }

    function stopListen() {
      if (!listening) { return; }

      if (sio) {
        sio.removeListener(CONTACT_SIO_EVENTS.CREATED, liveNotificationHandlerOnCreate);
        sio.removeListener(CONTACT_SIO_EVENTS.DELETED, liveNotificationHandlerOnDelete);
        sio.removeListener(CONTACT_SIO_EVENTS.UPDATED, liveNotificationHandlerOnUpdate);
      }

      listening = false;
      $log.debug('Stop listening contact live update');
    }

    return {
      startListen: startListen,
      stopListen: stopListen
    };
  });
