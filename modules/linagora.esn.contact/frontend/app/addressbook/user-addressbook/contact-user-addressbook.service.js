(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .service('contactUserAddressbookService', contactUserAddressbookService);

  function contactUserAddressbookService(CONTACT_ADDRESSBOOK_TYPES) {
    return {
      isUserAddressbook: isUserAddressbook
    };

    function isUserAddressbook(shell) {
      return !!shell && shell.type === CONTACT_ADDRESSBOOK_TYPES.user;
    }
  }
})(angular);
