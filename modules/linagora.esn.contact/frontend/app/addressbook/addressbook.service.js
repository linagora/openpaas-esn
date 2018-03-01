(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(esnI18nService, DEFAULT_ADDRESSBOOK_NAME) {
    return {
      getDisplayName: getDisplayName
    };

    function getDisplayName(addressBook) {
      if (addressBook.bookName === DEFAULT_ADDRESSBOOK_NAME) {
        return esnI18nService.translate('My contacts').toString();
      }

      return addressBook.name;
    }
  }
})(angular);
