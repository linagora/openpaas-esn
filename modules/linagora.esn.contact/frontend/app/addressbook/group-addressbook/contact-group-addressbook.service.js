(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .service('contactGroupAddressbookService', contactGroupAddressbookService);

  function contactGroupAddressbookService(CONTACT_ADDRESSBOOK_TYPES) {
    return {
      isGroupAddressbook: isGroupAddressbook
    };

    function isGroupAddressbook(shell) {
      return !!shell && shell.type === CONTACT_ADDRESSBOOK_TYPES.group;
    }
  }
})(angular);
