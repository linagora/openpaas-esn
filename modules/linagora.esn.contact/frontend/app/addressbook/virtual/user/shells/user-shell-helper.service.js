(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserShellHelper', ContactUserShellHelper);

  function ContactUserShellHelper(CONTACT_ADDRESSBOOK_TYPES) {
    return {
      isUser: isUser,
      isAddressbook: isAddressbook
    };

    function isUser(shell) {
      return shell && shell.addressbook && shell.addressbook.type === CONTACT_ADDRESSBOOK_TYPES.virtual;
    }

    function isAddressbook(shell) {
      return Boolean(shell && shell.type === CONTACT_ADDRESSBOOK_TYPES.virtual);
    }
  }
})(angular);
