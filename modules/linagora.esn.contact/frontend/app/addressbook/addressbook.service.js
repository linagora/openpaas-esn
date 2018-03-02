(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(ContactAPIClient, session) {
    return {
      getAddressbookByBookName: getAddressbookByBookName,
      isEditableAddressbook: isEditableAddressbook,
      listAddressbooks: listAddressbooks,
      listEditableAddressbooks: listEditableAddressbooks
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

    function isEditableAddressbook(bookName) {
      return listEditableAddressbooks().then(function(addressbooks) {
        return addressbooks.some(function(addressbook) {
          return bookName === addressbook.bookName;
        });
      });
    }
  }
})(angular);
