(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserVirtualAddressBookDisplayShell', ContactUserVirtualAddressBookDisplayShell);

  function ContactUserVirtualAddressBookDisplayShell(esnI18nService, ContactAddressbookDisplayShell) {
    var ContactUserVirtualAddressBookDisplayShell = function(shell) {
      this.shell = shell;
      this.icon = 'mdi-account-multiple';
      this.displayName = esnI18nService.translate(shell.name).toString();
    };

    ContactUserVirtualAddressBookDisplayShell.prototype = new ContactAddressbookDisplayShell();

    return ContactUserVirtualAddressBookDisplayShell;
  }

})(angular);
