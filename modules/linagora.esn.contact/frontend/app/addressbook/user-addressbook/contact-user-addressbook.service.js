(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .service('contactUserAddressbookService', contactUserAddressbookService);

  function contactUserAddressbookService(CONTACT_USER_ADDRESSBOOK_TYPE) {
    return {
      isUserAddressbook: isUserAddressbook
    };

    function isUserAddressbook(shell) {
      return !!shell && shell.type === CONTACT_USER_ADDRESSBOOK_TYPE;
    }
  }
})(angular);
