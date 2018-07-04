(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactLiveUpdate', ContactLiveUpdate);

  function ContactLiveUpdate(
    $rootScope,
    $log,
    livenotification,
    contactService,
    ContactShellBuilder,
    contactAvatarService,
    CONTACT_EVENTS,
    CONTACT_WS,
    CONTACT_ADDRESSBOOK_EVENTS
  ) {
    var sio = null;
    var listening = false;

    return {
      startListen: startListen,
      stopListen: stopListen
    };

    function startListen(bookId) {
      if (listening) { return; }

      if (sio === null) {
        sio = livenotification(CONTACT_WS.room, bookId);
      }
      sio.on(CONTACT_WS.events.CREATED, onCreate);
      sio.on(CONTACT_WS.events.DELETED, onDelete);
      sio.on(CONTACT_WS.events.UPDATED, onUpdate);
      sio.on(CONTACT_WS.events.ADDRESSBOOK_DELETED, onAddressbookDelete);

      listening = true;
      $log.debug('Start listening contact live update');
    }

    function stopListen() {
      if (!listening) { return; }

      if (sio) {
        sio.removeListener(CONTACT_WS.events.CREATED, onCreate);
        sio.removeListener(CONTACT_WS.events.DELETED, onDelete);
        sio.removeListener(CONTACT_WS.events.UPDATED, onUpdate);
        sio.removeListener(CONTACT_WS.events.ADDRESSBOOK_DELETED, onAddressbookDelete);
      }

      listening = false;
      $log.debug('Stop listening contact live update');
    }

    function onCreate(data) {
      ContactShellBuilder.fromWebSocket(data).then(function(shell) {
        contactAvatarService.injectTextAvatar(shell);
        $rootScope.$broadcast(CONTACT_EVENTS.CREATED, shell);
      }, function() {
        $log.debug('Can not build the contact from websocket data');
      });
    }

    function onDelete(data) {
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, { id: data.contactId });
    }

    function onUpdate(data) {
      contactService.getContact({ bookId: data.bookId, bookName: data.bookName }, data.contactId)
        .then(function(updatedContact) {
          $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, updatedContact);
        }, function(err) {
          $log.error('Can not get contact', err);
        });
    }

    function onAddressbookDelete(data) {
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, data);
    }
  }
})(angular);
