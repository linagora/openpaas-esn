(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(
    esnI18nService,
    session,
    ContactAPIClient,
    DEFAULT_ADDRESSBOOK_NAME,
    CONTACT_COLLECTED_ADDRESSBOOK_NAME
  ) {
    return {
      getDisplayName: getDisplayName,
      listAddressbooks: listAddressbooks,
      listEditableAddressbooks: listEditableAddressbooks,
      isEditableAddressbook: isEditableAddressbook
    };

    function getDisplayName(addressBook) {
      if (addressBook.bookName === DEFAULT_ADDRESSBOOK_NAME) {
        return esnI18nService.translate('My contacts').toString();
      }
      if (addressBook.bookName === CONTACT_COLLECTED_ADDRESSBOOK_NAME) {
        return esnI18nService.translate('Collected contacts').toString();
      }

      return addressBook.name;
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
