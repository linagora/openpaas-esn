(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(
    $rootScope,
    session,
    ContactAPIClient,
    CONTACT_ADDRESSBOOK_EVENTS
  ) {
    var CONTACT_ADDRESSBOOK_DEFAULT_TYPE = 'user';

    return {
      createAddressbook: createAddressbook,
      getAddressbookByBookName: getAddressbookByBookName,
      listAddressbooks: listAddressbooks,
      listEditableAddressbooks: listEditableAddressbooks,
      removeAddressbook: removeAddressbook,
      updateAddressbook: updateAddressbook
    };

    function getAddressbookByBookName(bookName) {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook(bookName).get();
    }

    function listAddressbooks() {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook().list();
    }

    function listEditableAddressbooks() {
      return listAddressbooks().then(function(addressbooks) {
        return addressbooks.filter(function(addressbook) {
          return addressbook.editable;
        });
      });
    }

    function createAddressbook(addressbook) {
      if (!addressbook) {
        return $q.reject(new Error('Address book is required'));
      }

      if (!addressbook.name) {
        return $q.reject(new Error('Address book\'s name is required'));
      }

      addressbook.type = CONTACT_ADDRESSBOOK_DEFAULT_TYPE;

      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook()
        .create(addressbook)
        .then(function(createdAddressbook) {
          $rootScope.$broadcast(
            CONTACT_ADDRESSBOOK_EVENTS.CREATED,
            createdAddressbook
          );
        });
    }

    function removeAddressbook(addressbook) {
      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .remove()
        .then(function() {
          $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, addressbook);
        });
    }

    function updateAddressbook(addressbook) {
      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .update(addressbook)
        .then(function() {
          $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, addressbook);
        });
    }
  }
})(angular);
